import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator';
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
  @Permissions('user.create')
  create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(req.user as AuthenticatedUser, createUserDto);
  }

  @Get()
  @Permissions('user.read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  getProfile(@Req() req: Request): AuthenticatedUser {
    return req.user as AuthenticatedUser;
  }

  @Get(':id')
  @Permissions('user.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('user.update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @Permissions('user.assign_role')
  assignRole(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.usersService.assignRole(req.user as AuthenticatedUser, id, assignRoleDto);
  }

  @Patch(':id/status')
  @Permissions('user.update')
  updateStatus(@Param('id') id: string, @Body() updateUserStatusDto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }

  @Delete(':id')
  @Permissions('user.delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
