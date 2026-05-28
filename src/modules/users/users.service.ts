import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { canManageRole, isSupportedRole } from '../permissions/role-permission.util';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AuthenticatedUser, createUserDto: CreateUserDto) {
    this.ensureRoleCanBeManaged(actor, createUserDto.role);

    const existingUser = await this.prisma.authUser.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          createUserDto.phone ? { phone: createUserDto.phone } : undefined,
        ].filter(Boolean) as { email?: string; phone?: string }[],
      },
    });

    if (existingUser?.email === createUserDto.email) {
      throw new ConflictException({ error: 'EMAIL_ALREADY_EXISTS' });
    }

    if (createUserDto.phone && existingUser?.phone === createUserDto.phone) {
      throw new ConflictException({ error: 'PHONE_ALREADY_EXISTS' });
    }

    const role = await this.prisma.role.findUnique({
      where: { name: createUserDto.role },
    });

    if (!role) {
      throw new NotFoundException({ error: 'ROLE_NOT_FOUND' });
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    const createdUser = await this.prisma.authUser.create({
      data: {
        email: createUserDto.email,
        password_hash: passwordHash,
        profileImage: createUserDto.profileImage,
        entity_type: createUserDto.role.toLowerCase(),
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        phone: createUserDto.phone,
        is_active: true,
        status: 'ACTIVE',
        roles: {
          create: {
            role: {
              connect: { id: role.id },
            },
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.toUserResponse(createdUser);
  }

  async findAll() {
    const users = await this.prisma.authUser.findMany({
      where: { deletedAt: null },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.toUserResponse(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.authUser.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException({ error: 'USER_NOT_FOUND' });
    }

    return this.toUserResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.ensureUserExists(id);

    if (updateUserDto.phone) {
      const existingPhone = await this.prisma.authUser.findFirst({
        where: {
          phone: updateUserDto.phone,
          NOT: { id },
        },
      });

      if (existingPhone) {
        throw new ConflictException({ error: 'PHONE_ALREADY_EXISTS' });
      }
    }

    const updatedUser = await this.prisma.authUser.update({
      where: { id },
      data: {
        first_name: updateUserDto.first_name,
        last_name: updateUserDto.last_name,
        phone: updateUserDto.phone,
        profileImage: updateUserDto.profileImage,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.toUserResponse(updatedUser);
  }

  async assignRole(actor: AuthenticatedUser, id: string, assignRoleDto: AssignRoleDto) {
    this.ensureRoleCanBeManaged(actor, assignRoleDto.role);
    await this.ensureUserExists(id);

    const role = await this.prisma.role.findUnique({
      where: { name: assignRoleDto.role },
    });

    if (!role) {
      throw new NotFoundException({ error: 'ROLE_NOT_FOUND' });
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      return tx.authUser.update({
        where: { id },
        data: {
          entity_type: assignRoleDto.role.toLowerCase(),
          roles: {
            create: {
              role: {
                connect: { id: role.id },
              },
            },
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    return this.toUserResponse(updatedUser);
  }

  async updateStatus(id: string, updateUserStatusDto: UpdateUserStatusDto) {
    await this.ensureUserExists(id);

    const isActive = updateUserStatusDto.status === 'ACTIVE';
    const deletedAt = updateUserStatusDto.status === 'INACTIVE' ? new Date() : null;

    const updatedUser = await this.prisma.authUser.update({
      where: { id },
      data: {
        status: updateUserStatusDto.status,
        is_active: isActive,
        deletedAt,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.toUserResponse(updatedUser);
  }

  async remove(id: string) {
    await this.ensureUserExists(id);

    const deletedUser = await this.prisma.authUser.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        is_active: false,
        deletedAt: new Date(),
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.toUserResponse(deletedUser);
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.authUser.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException({ error: 'USER_NOT_FOUND' });
    }

    return user;
  }

  private ensureRoleCanBeManaged(actor: AuthenticatedUser, targetRole: string) {
    if (!isSupportedRole(targetRole) || !canManageRole(actor.roles, targetRole)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        required: targetRole,
        message: 'You are not allowed to assign this role.',
      });
    }
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    entity_type: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    is_active: boolean;
    status: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    roles: { role: { name: string } }[];
  }) {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      entity_type: user.entity_type,
      is_active: user.is_active,
      status: user.status,
      deleted_at: user.deletedAt,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      roles: user.roles.map((userRole) => userRole.role.name),
    };
  }
}
