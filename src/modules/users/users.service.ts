/**
 * users.service.ts
 *
 * Changes vs original
 * ───────────────────
 * A-03  updateStatus() no longer writes deletedAt. Status and soft-deletion
 *       are now separate concerns.  Only remove() sets deletedAt.
 * B-01  update() wraps all three table writes (authUser + student + teacher)
 *       inside a single prisma.$transaction() so they are atomic.
 * B-03  updateStatus() now handles every status value the DTO accepts:
 *       ACTIVE → is_active true
 *       INACTIVE → is_active false  (no deletedAt)
 *       SUSPENDED → is_active false (no deletedAt)
 *       LOCKED → is_active false    (no deletedAt)
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import {
  canManageRole,
  isSupportedRole,
} from '../permissions/role-permission.util';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

// ─── Prisma include shape reused across queries ──────────────────────────────

const userWithRoles = {
  roles: {
    include: { role: true },
  },
} satisfies Prisma.AuthUserInclude;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(actor: AuthenticatedUser, createUserDto: CreateUserDto) {
    this.ensureRoleCanBeManaged(actor, createUserDto.role);

    const existingUser = await this.prisma.authUser.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          createUserDto.phone ? { phone: createUserDto.phone } : undefined,
        ].filter(Boolean),
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
    if (!role) throw new NotFoundException({ error: 'ROLE_NOT_FOUND' });

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
          create: { role: { connect: { id: role.id } } },
        },
      },
      include: userWithRoles,
    });

    return this.toUserResponse(createdUser);
  }

  // ─── FindAll ───────────────────────────────────────────────────────────────

  async findAll() {
    const users = await this.prisma.authUser.findMany({
      where: { deletedAt: null },
      include: userWithRoles,
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.toUserResponse(u));
  }

  // ─── FindOne ───────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const user = await this.prisma.authUser.findUnique({
      where: { id },
      include: userWithRoles,
    });
    if (!user || user.deletedAt) {
      throw new NotFoundException({ error: 'USER_NOT_FOUND' });
    }
    return this.toUserResponse(user);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * B-01 — All three table writes are wrapped in a single transaction.
   * If the Student or Teacher sync fails the AuthUser change is rolled back.
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.ensureUserExists(id);

    if (updateUserDto.phone) {
      const existingPhone = await this.prisma.authUser.findFirst({
        where: { phone: updateUserDto.phone, NOT: { id } },
      });
      if (existingPhone) {
        throw new ConflictException({ error: 'PHONE_ALREADY_EXISTS' });
      }
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // 1. Update AuthUser
      const auth = await tx.authUser.update({
        where: { id },
        data: {
          first_name: updateUserDto.first_name,
          last_name: updateUserDto.last_name,
          phone: updateUserDto.phone,
          profileImage: updateUserDto.profileImage,
        },
        include: userWithRoles,
      });

      // 2. Sync Student record (matched by email)
      if (auth.email) {
        const student = await tx.student.findUnique({
          where: { email: auth.email },
        });
        if (student) {
          await tx.student.update({
            where: { id: student.id },
            data: {
              firstName: updateUserDto.first_name,
              lastName: updateUserDto.last_name,
              phone: updateUserDto.phone,
              profileImage: updateUserDto.profileImage,
            },
          });
        }
      }

      // 3. Sync Teacher record (matched by userId)
      const teacher = await tx.teacher.findUnique({ where: { userId: id } });
      if (teacher) {
        await tx.teacher.update({
          where: { id: teacher.id },
          data: {
            firstName: updateUserDto.first_name,
            lastName: updateUserDto.last_name,
            phone: updateUserDto.phone,
          },
        });
      }

      return auth;
    });

    return this.toUserResponse(updatedUser);
  }

  // ─── AssignRole ────────────────────────────────────────────────────────────

  async assignRole(
    actor: AuthenticatedUser,
    id: string,
    assignRoleDto: AssignRoleDto,
  ) {
    this.ensureRoleCanBeManaged(actor, assignRoleDto.role);
    await this.ensureUserExists(id);

    const role = await this.prisma.role.findUnique({
      where: { name: assignRoleDto.role },
    });
    if (!role) throw new NotFoundException({ error: 'ROLE_NOT_FOUND' });

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });

      return tx.authUser.update({
        where: { id },
        data: {
          entity_type: assignRoleDto.role.toLowerCase(),
          roles: {
            create: { role: { connect: { id: role.id } } },
          },
        },
        include: userWithRoles,
      });
    });

    return this.toUserResponse(updatedUser);
  }

  // ─── UpdateStatus ──────────────────────────────────────────────────────────

  /**
   * A-03 — deletedAt is never written here. Soft-deletion is handled
   *        exclusively by remove().
   *
   * B-03 — All four DTO statuses are handled:
   *   ACTIVE    → is_active = true
   *   INACTIVE  → is_active = false  (account disabled, not deleted)
   *   SUSPENDED → is_active = false  (temporary enforcement action)
   *   LOCKED    → is_active = false  (failed-login lock)
   */
  async updateStatus(id: string, updateUserStatusDto: UpdateUserStatusDto) {
    await this.ensureUserExists(id);

    const isActive = updateUserStatusDto.status === 'ACTIVE';

    const updatedUser = await this.prisma.authUser.update({
      where: { id },
      data: {
        status: updateUserStatusDto.status,
        is_active: isActive,
        // deletedAt intentionally NOT set here — only remove() does that
      },
      include: userWithRoles,
    });

    return this.toUserResponse(updatedUser);
  }

  // ─── Remove (soft-delete) ──────────────────────────────────────────────────

  async remove(id: string) {
    await this.ensureUserExists(id);

    const deletedUser = await this.prisma.authUser.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        is_active: false,
        deletedAt: new Date(),           // only remove() writes deletedAt
      },
      include: userWithRoles,
    });

    return this.toUserResponse(deletedUser);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async ensureUserExists(id: string) {
    const user = await this.prisma.authUser.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new NotFoundException({ error: 'USER_NOT_FOUND' });
    }
    return user;
  }

  private ensureRoleCanBeManaged(
    actor: AuthenticatedUser,
    targetRole: string,
  ) {
    if (
      !isSupportedRole(targetRole) ||
      !canManageRole(actor.roles, targetRole)
    ) {
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
    profileImage: string | null;
    entity_type: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    is_active: boolean;
    status: string;
    last_login_at: Date | null;
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
      profile_image: user.profileImage,
      entity_type: user.entity_type,
      is_active: user.is_active,
      status: user.status,
      last_login_at: user.last_login_at,
      deleted_at: user.deletedAt,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      roles: user.roles.map((ur) => ur.role.name),
    };
  }
}