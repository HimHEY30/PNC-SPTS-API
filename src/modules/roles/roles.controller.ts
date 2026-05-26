import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post('roles')
  @Permissions('role.create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get('roles')
  @Permissions('role.read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @Permissions('permission.read')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get('roles/:id')
  @Permissions('role.read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch('roles/:id')
  @Permissions('role.update')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete('roles/:id')
  @Permissions('role.delete')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post('roles/:id/permissions')
  @Permissions('permission.assign')
  assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, assignPermissionsDto);
  }
}
