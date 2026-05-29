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
    user_id: string,
    token_hash: string,
    expires_at: Date,
  ) {
    return this.prisma.refreshToken.create({
      data: {
        user_id: user_id,
        token_hash: token_hash,
        expires_at: expires_at,
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
    user_id: string,
    token_hash: string,
    expires_at: Date,
  ) {
    return this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: {
          user_id: user_id,
          token_hash: token_hash,
          expires_at: expires_at,
        },
      }),
      this.prisma.authUser.update({
        where: { id: user_id },
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
    user_id: string,
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
        },
      }),
      this.prisma.refreshToken.create({
        data: {
          user_id: user_id,
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
        revoked_at: null,
      },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    });
  }

  async revokeAllActiveRefreshTokensByUserId(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.authUser.update({
      where: { id: userId },
      data: { password_hash: passwordHash },
    });
  }

  async createPasswordResetToken(userId: string, token_hash: string, expires_at: Date) {
    return this.prisma.passwordResetToken.create({
      data: {
        user_id: userId,
        token_hash: token_hash,
        expires_at: expires_at,
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