import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from './users.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

const profileImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'profile-images');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.create')
  @UseInterceptors(FileInterceptor('image', { storage: profileImageStorage }))
  async create(@Req() req: Request, @Body() createUserDto: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      (createUserDto as any).profileImage = `/uploads/profile-images/${file.filename}`;
    }
    return this.usersService.create(req.user as AuthenticatedUser, createUserDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const userId = (req.user as AuthenticatedUser).user_id;
    return this.usersService.findOne(userId);
  }

  @Patch('profile')
  updateProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const userId = (req.user as AuthenticatedUser).user_id;
    return this.usersService.update(userId, updateUserDto);
  }

  @Post('profile/image')
  @Public()
  @UseInterceptors(FileInterceptor('image', { storage: profileImageStorage }))
  async uploadProfileImage(@Req() req: Request, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new Error('No image file provided');
    }
    return { url: `/uploads/profile-images/${file.filename}` };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.update')
  @UseInterceptors(FileInterceptor('image', { storage: profileImageStorage }))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      (updateUserDto as any).profileImage = `/uploads/profile-images/${file.filename}`;
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.assign_role')
  assignRole(@Req() req: Request, @Param('id') id: string, @Body() assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole(req.user as AuthenticatedUser, id, assignRoleDto);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.update')
  updateStatus(@Param('id') id: string, @Body() updateUserStatusDto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
