import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.authUser.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.authUser.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async createUser(email: string, passwordHash: string) {
    return this.prisma.authUser.create({
      data: {
        email,
        password_hash: passwordHash,
        entity_type: 'teacher',
        is_active: true,
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
}
