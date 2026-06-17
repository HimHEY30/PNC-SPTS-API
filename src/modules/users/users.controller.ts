/**
 * users.controller.ts
 *
 * Image update coverage
 * ─────────────────────
 * PATCH /users/profile        — own profile (any authenticated user)
 * PATCH /users/:id            — any user (ADMIN / SUPER_ADMIN)
 *
 * Both endpoints share the same image resolution logic via resolveProfileImage():
 *   Priority 1 — uploaded file  (`image` field, multipart/form-data)
 *   Priority 2 — remote URL     (`profileImageUrl` field, form body)
 *   Priority 3 — no value       (existing image is preserved in the DB)
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ROLE_HIERARCHY } from '../permissions/rbac.constants';
import {
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  profileImageFileFilter,
  profileImageStorage,
  toUploadUrl,
} from '../../config/storage.config';

import { UsersService } from './users.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

// ── Shared Multer options ────────────────────────────────────────────────────

const profileImageInterceptorOptions = {
  storage: profileImageStorage,
  fileFilter: profileImageFileFilter,
  limits: { fileSize: PROFILE_IMAGE_MAX_SIZE_BYTES },
};

// ── Reusable Swagger schema for update endpoints ─────────────────────────────

const UPDATE_USER_FORM_DATA_SCHEMA = {
  type: 'object',
  properties: {
    first_name: { type: 'string', maxLength: 100, example: 'Sophea' },
    last_name: { type: 'string', maxLength: 100, example: 'Chan' },
    phone: {
      type: 'string',
      description: 'E.164 format (e.g. +85512345678)',
      example: '+85512345678',
    },
    image: {
      type: 'string',
      format: 'binary',
      description:
        'New profile image file (JPEG / PNG / WEBP / GIF, max 5 MB). ' +
        'Takes priority over profileImageUrl.',
    },
    profileImageUrl: {
      type: 'string',
      format: 'uri',
      maxLength: 2048,
      description:
        'Publicly accessible image URL. Used only when no file is uploaded.',
      example: 'https://example.com/new-avatar.jpg',
    },
  },
} as const;

// ── Shared image resolver ────────────────────────────────────────────────────

/**
 * Resolves the final profileImage value and removes the transport-only
 * `profileImageUrl` field so it is never forwarded to the service / Prisma.
 *
 * Resolution order:
 *   1. Multer file  → server-relative path  (highest priority)
 *   2. Remote URL   → stored as-is
 *   3. undefined    → service leaves the existing value unchanged
 */
function resolveProfileImage(
  dto: UpdateUserDto,
  file?: Express.Multer.File,
): void {
  if (file) {
    dto.profileImage = toUploadUrl('profile-images', file.filename);
  } else if (dto.profileImageUrl) {
    dto.profileImage = dto.profileImageUrl;
  }
  delete dto.profileImageUrl;
}

// ── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Users')
@ApiSecurity('bearer')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Create user ────────────────────────────────────────────────────────────

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.create')
  @UseInterceptors(FileInterceptor('image', profileImageInterceptorOptions))
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Submit as **multipart/form-data**. Supply either an image file ' +
      '(`image`) or a remote URL (`profileImageUrl`). File takes precedence.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['first_name', 'last_name', 'email', 'password', 'role'],
      properties: {
        first_name: { type: 'string', maxLength: 100, example: 'Sophea' },
        last_name: { type: 'string', maxLength: 100, example: 'Chan' },
        email: { type: 'string', format: 'email', example: 'sophea@example.com' },
        password: {
          type: 'string',
          format: 'password',
          minLength: 8,
          description: 'Requires uppercase, lowercase, digit, and special character.',
          example: 'Secure@123',
        },
        phone: { type: 'string', example: '+85512345678' },
        role: {
          type: 'string',
          enum: [...ROLE_HIERARCHY],
          example: 'STUDENT',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file (max 5 MB). Takes priority over profileImageUrl.',
        },
        profileImageUrl: {
          type: 'string',
          format: 'uri',
          example: 'https://example.com/avatar.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists.' })
  async create(
    @Req() req: Request,
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createUserDto.profileImage = toUploadUrl('profile-images', file.filename);
    } else if (createUserDto.profileImageUrl) {
      createUserDto.profileImage = createUserDto.profileImageUrl;
    }
    delete createUserDto.profileImageUrl;

    return this.usersService.create(req.user, createUserDto);
  }

  // ── List users ─────────────────────────────────────────────────────────────

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.read')
  @ApiOperation({ summary: 'List all active users' })
  findAll() {
    return this.usersService.findAll();
  }

  // ── Own profile ────────────────────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: "Get the current user's own profile" })
  async getProfile(@Req() req: Request) {
    return this.usersService.findOne(req.user.user_id);
  }

  /**
   * PATCH /users/profile
   *
   * Any authenticated user may update their own profile.
   * Content-Type: multipart/form-data
   *
   * Image options:
   *   • Upload a file  → `image` (file field)
   *   • Supply a URL   → `profileImageUrl` (text field)
   *   • Omit both      → existing image is preserved
   */
  @Patch('profile')
  @UseInterceptors(FileInterceptor('image', profileImageInterceptorOptions))
  @ApiOperation({
    summary: "Update the current user's own profile",
    description:
      'Submit as **multipart/form-data**. All fields are optional. ' +
      'To change the profile image supply either a file (`image`) or a ' +
      'remote URL (`profileImageUrl`). Omit both to keep the current image.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: UPDATE_USER_FORM_DATA_SCHEMA })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error or unsupported file type.' })
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    resolveProfileImage(updateUserDto, file);
    return this.usersService.update(req.user.user_id, updateUserDto);
  }

  // ── Upload own profile image (file-only dedicated endpoint) ───────────────

  @Post('profile/image')
  @UseInterceptors(FileInterceptor('image', profileImageInterceptorOptions))
  @ApiOperation({ summary: "Upload the current user's profile image (file only)" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Returns the stored image URL.' })
  @ApiResponse({ status: 400, description: 'No image file provided.' })
  async uploadProfileImage(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    const url = toUploadUrl('profile-images', file.filename);
    return { url };
  }

  // ── Single user — admin ────────────────────────────────────────────────────

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.read')
  @ApiOperation({ summary: 'Get a specific user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * PATCH /users/:id
   *
   * ADMIN / SUPER_ADMIN may update any user's profile.
   * Content-Type: multipart/form-data
   *
   * Image options:
   *   • Upload a file  → `image` (file field)
   *   • Supply a URL   → `profileImageUrl` (text field)
   *   • Omit both      → existing image is preserved
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.update')
  @UseInterceptors(FileInterceptor('image', profileImageInterceptorOptions))
  @ApiOperation({
    summary: 'Update a user (admin)',
    description:
      'Submit as **multipart/form-data**. All fields are optional. ' +
      'To change the profile image supply either a file (`image`) or a ' +
      'remote URL (`profileImageUrl`). Omit both to keep the current image.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: UPDATE_USER_FORM_DATA_SCHEMA })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error or unsupported file type.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    resolveProfileImage(updateUserDto, file);
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.assign_role')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  assignRole(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.usersService.assignRole(req.user, id, assignRoleDto);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Update the status of a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.delete')
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}