import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const authUserWithRolesInclude = {
  roles: {
    include: {
      role: true,
    },
  },
} satisfies Prisma.AuthUserInclude;

export type AuthUserWithRoles = Prisma.AuthUserGetPayload<{
  include: typeof authUserWithRolesInclude;
}>;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<AuthUserWithRoles | null> {
    return this.prisma.authUser.findUnique({
      where: { email },
      include: authUserWithRolesInclude,
    });
  }

  async findUserById(userId: string): Promise<AuthUserWithRoles | null> {
    return this.prisma.authUser.findUnique({
      where: { id: userId },
      include: authUserWithRolesInclude,
    });
  }

  async createUser(email: string, passwordHash: string) {
    return this.prisma.authUser.create({
      data: {
        email,
        password_hash: passwordHash,
        entity_type: 'teacher',
        first_name: 'Public',
        last_name: 'Registration',
        is_active: true,
        status: 'ACTIVE',
      },
    });
  }

  async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  async updateUserLoginTimestamp(userId: string) {
    return this.prisma.authUser.update({
      where: { id: userId },
      data: { last_login_at: new Date() },
    });
  }

  async performTransaction(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: {
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt,
        },
      }),
      this.prisma.authUser.update({
        where: { id: userId },
        data: { last_login_at: new Date() },
      }),
    ]);
  }

  async findRefreshTokensByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rotateRefreshToken(
    oldRefreshTokenId: string,
    userId: string,
    newTokenHash: string,
    newExpiresAt: Date,
  ) {
    const revokedAt = new Date();
    return this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: oldRefreshTokenId },
        data: {
          revoked: true,
          revoked_at: revokedAt,
        } as any,
      }),
      this.prisma.refreshToken.create({
        data: {
          user_id: userId,
          token_hash: newTokenHash,
          expires_at: newExpiresAt,
        },
      }),
    ]);
  }

  async revokeRefreshTokenById(tokenId: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        id: tokenId,
        revoked_at: null as any,
      } as any,
      data: {
        revoked: true,
        revoked_at: new Date(),
      } as any,
    });
  }

  async revokeAllActiveRefreshTokensByUserId(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        revoked_at: null as any,
      } as any,
      data: {
        revoked: true,
        revoked_at: new Date(),
      } as any,
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.authUser.update({
      where: { id: userId },
      data: { password_hash: passwordHash },
    });
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.passwordResetToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  async findUnusedResetTokensByUserId(userId: string) {
    return this.prisma.passwordResetToken.findMany({
      where: {
        user_id: userId,
        used_at: null,
      },
    });
  }

  async markResetTokenAsUsed(tokenId: string) {
    return this.prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { used_at: new Date() },
    });
  }
}
