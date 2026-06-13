/**
 * users.controller.ts
 *
 * Changes vs original
 * ───────────────────
 * A-01  Removed @Public() from POST /users/profile/image — endpoint now
 *       requires a valid JWT like every other route on this controller.
 * A-02  Added MIME whitelist (profileImageFileFilter) and 5 MB size limit
 *       (PROFILE_IMAGE_MAX_SIZE_BYTES) to every FileInterceptor.
 * A-03  (see users.service.ts) updateStatus() no longer touches deletedAt.
 * A-04  Replaced raw `throw new Error(...)` with BadRequestException so
 *       NestJS exception filters return a proper 400 JSON response.
 * C-03  Storage config moved to common/config/storage.config.ts.
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
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';           // B-04
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  profileImageFileFilter,
  profileImageStorage,
  toUploadUrl,
} from '../../config/storage.config';                                 // C-03

import { UsersService } from './users.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

/** Shared FileInterceptor options used by every image-upload route. */
const profileImageInterceptorOptions = {
  storage: profileImageStorage,
  fileFilter: profileImageFileFilter,           // A-02 — MIME whitelist
  limits: { fileSize: PROFILE_IMAGE_MAX_SIZE_BYTES }, // A-02 — 5 MB cap
};

@Controller('users')
@UseGuards(JwtAuthGuard)                        // B-04 — explicit JWT guard
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Create user ────────────────────────────────────────────────────────────

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.create')
  @UseInterceptors(
    FileInterceptor('image', profileImageInterceptorOptions),
  )
  async create(
    @Req() req: Request,
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createUserDto.profileImage = toUploadUrl('profile-images', file.filename);
    }
    return this.usersService.create(req.user, createUserDto);
  }

  // ─── List users ─────────────────────────────────────────────────────────────

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.read')
  findAll() {
    return this.usersService.findAll();
  }

  // ─── Own profile (any authenticated user) ───────────────────────────────────

  @Get('profile')
  async getProfile(@Req() req: Request) {
    return this.usersService.findOne(req.user.user_id);
  }

  @Patch('profile')
  updateProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.user_id, updateUserDto);
  }

  /**
   * POST /users/profile/image
   *
   * A-01: @Public() decorator removed — caller must supply a valid JWT.
   * A-02: MIME whitelist + 5 MB size limit enforced via shared options.
   * A-04: Throws BadRequestException (400) instead of raw Error (500) when no
   *       file is present.
   */
  @Post('profile/image')
  @UseInterceptors(
    FileInterceptor('image', profileImageInterceptorOptions),
  )
  async uploadProfileImage(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided'); // A-04
    }
    const url = toUploadUrl('profile-images', file.filename);
    return { url };
  }

  // ─── Single user (admin) ────────────────────────────────────────────────────

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.update')
  @UseInterceptors(
    FileInterceptor('image', profileImageInterceptorOptions),
  )
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      updateUserDto.profileImage = toUploadUrl('profile-images', file.filename);
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.assign_role')
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
  updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}