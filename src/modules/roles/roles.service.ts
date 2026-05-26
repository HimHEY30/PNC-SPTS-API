import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ROLE_HIERARCHY } from '../permissions/rbac.constants';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException({
        error: 'ROLE_ALREADY_EXISTS',
        message: `Role with name ${createRoleDto.name} already exists.`,
      });
    }

    const permissions = createRoleDto.permissions ?? [];

    if (permissions.length > 0) {
      // Seed permissions dynamically if they do not exist
      await Promise.all(
        permissions.map((name) =>
          this.prisma.permission.upsert({
            where: { name },
            update: {},
            create: { name },
          }),
        ),
      );
    }

    const created = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: {
          connect: permissions.map((name) => ({ name })),
        },
      },
      include: {
        permissions: true,
      },
    });

    return this.toRoleResponse(created);
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: true,
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => this.toRoleResponse(role));
  }

  async findOne(idOrName: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
      include: {
        permissions: true,
      },
    });

    if (!role) {
      throw new NotFoundException({
        error: 'ROLE_NOT_FOUND',
        message: `Role with ID or name '${idOrName}' was not found.`,
      });
    }

    return this.toRoleResponse(role);
  }

  async update(idOrName: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
    });

    if (!role) {
      throw new NotFoundException({
        error: 'ROLE_NOT_FOUND',
        message: `Role with ID or name '${idOrName}' was not found.`,
      });
    }

    const data: any = {};
    if (updateRoleDto.description !== undefined) {
      data.description = updateRoleDto.description;
    }

    if (updateRoleDto.permissions !== undefined) {
      // Seed permissions dynamically if they do not exist
      await Promise.all(
        updateRoleDto.permissions.map((name) =>
          this.prisma.permission.upsert({
            where: { name },
            update: {},
            create: { name },
          }),
        ),
      );

      data.permissions = {
        set: updateRoleDto.permissions.map((name) => ({ name })),
      };
    }

    const updated = await this.prisma.role.update({
      where: { id: role.id },
      data,
      include: {
        permissions: true,
      },
    });

    return this.toRoleResponse(updated);
  }

  async remove(idOrName: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
    });

    if (!role) {
      throw new NotFoundException({
        error: 'ROLE_NOT_FOUND',
        message: `Role with ID or name '${idOrName}' was not found.`,
      });
    }

    // Protect system-defined roles from deletion
    if (ROLE_HIERARCHY.includes(role.name as any)) {
      throw new BadRequestException({
        error: 'SYSTEM_ROLE_CANNOT_BE_DELETED',
        message: `System-defined role '${role.name}' cannot be deleted.`,
      });
    }

    // Check if the role is currently in use
    const userCount = await this.prisma.userRole.count({
      where: { roleId: role.id },
    });

    if (userCount > 0) {
      throw new BadRequestException({
        error: 'ROLE_IN_USE',
        message: `Role '${role.name}' is currently assigned to ${userCount} user(s) and cannot be deleted.`,
      });
    }

    await this.prisma.role.delete({
      where: { id: role.id },
    });

    return { success: true, message: `Role '${role.name}' was successfully deleted.` };
  }

  async findAllPermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });

    return permissions.map((p) => p.name);
  }

  async assignPermissions(idOrName: string, assignPermissionsDto: AssignPermissionsDto) {
    const role = await this.prisma.role.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
    });

    if (!role) {
      throw new NotFoundException({
        error: 'ROLE_NOT_FOUND',
        message: `Role with ID or name '${idOrName}' was not found.`,
      });
    }

    const { permissions } = assignPermissionsDto;

    // Seed permissions dynamically if they do not exist
    await Promise.all(
      permissions.map((name) =>
        this.prisma.permission.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ),
    );

    const updated = await this.prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          set: permissions.map((name) => ({ name })),
        },
      },
      include: {
        permissions: true,
      },
    });

    return this.toRoleResponse(updated);
  }

  private toRoleResponse(role: {
    id: string;
    name: string;
    description: string | null;
    permissions: { name: string }[];
  }) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p) => p.name),
    };
  }
}
