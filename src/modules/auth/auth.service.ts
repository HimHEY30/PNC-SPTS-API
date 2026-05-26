import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthRepository } from './auth.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly DUMMY_PASSWORD_HASH =
    '$2b$12$0/c.N.d.E.f.G.h.I.j.K.L.m.N.o.P.q.R.s.T.u.V.w.X.y.Z.a.B.c'; // A valid bcrypt hash

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      await bcrypt.compare(password, this.DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException({ error: 'INVALID_CREDENTIALS' });
    }

    if (!user.is_active) {
      throw new ForbiddenException({ error: 'ACCOUNT_INACTIVE' });
    }

    const isPasswordMatching = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException({ error: 'INVALID_CREDENTIALS' });
    }

    const roles = user.roles.map((userRole) => userRole.role.name);

    const accessTokenPayload = {
      user_id: user.id,
      entity_type: user.entity_type,
      roles,
    };

    const refreshTokenPayload = {
      user_id: user.id,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    await this.authRepository.performTransaction(
      user.id,
      refreshTokenHash,
      refreshTokenExpiresAt,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new ConflictException({ error: 'USER_ALREADY_EXISTS' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.authRepository.createUser(email, passwordHash);

    // Return minimal user info (no password hash)
    return { id: user.id, email: user.email };
  }
}
