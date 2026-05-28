import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from './users.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.create')
  @UseInterceptors(FileInterceptor('image'))
  create(@Req() req: Request, @Body() createUserDto: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
    if (file && file.path) {
      (createUserDto as any).profileImage = file.path;
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
  getProfile(@Req() req: Request): AuthenticatedUser {
    return req.user as AuthenticatedUser;
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
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file?: Express.Multer.File) {
    if (file && file.path) {
      (updateUserDto as any).profileImage = file.path;
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
