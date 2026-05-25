import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async register(email: string, password: string, roleId?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username: email,
        password: hashed,
        role: {
          connect: {
            id: roleId ?? (await this.getDefaultRoleId()),
          },
        },
      },
    });
    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    const secret = this.config.get<string>('jwt.secret');
    const expiresIn = this.config.get<string>('jwt.expiration');

    const token = jwt.sign(payload, secret ?? '', {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });
    return { accessToken: token };
  }

  async logout() {
    // Stateless JWT: client should drop token. We can optionally implement token blacklisting.
    return { success: true };
  }

  private async getDefaultRoleId() {
    const role = await this.prisma.role.findFirst();
    if (!role) {
      const r = await this.prisma.role.create({ data: { name: 'user' } });
      return r.id;
    }
    return role.id;
  }
}
