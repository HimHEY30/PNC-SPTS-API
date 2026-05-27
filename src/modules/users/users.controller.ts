import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
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

  /** Create a new user — staff-level write operation */
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.create')
  create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(req.user as AuthenticatedUser, createUserDto);
  }

  /** List all users */
  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.read')
  findAll() {
    return this.usersService.findAll();
  }

  /** Get the currently authenticated user's profile — any authenticated role */
  @Get('profile')
  getProfile(@Req() req: Request): AuthenticatedUser {
    return req.user as AuthenticatedUser;
  }

  /** Get a single user by ID */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /** Update a user's basic info */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /** Assign or change a user's role */
  @Patch(':id/role')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.assign_role')
  assignRole(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.usersService.assignRole(req.user as AuthenticatedUser, id, assignRoleDto);
  }

  /** Activate or deactivate a user account */
  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.update')
  updateStatus(@Param('id') id: string, @Body() updateUserStatusDto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }

  /** Soft-delete a user */
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('user.delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
