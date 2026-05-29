import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthRepository } from './auth.repository';
import { ConfigService } from '@nestjs/config';
import { AuthLoginService } from './auth-login.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authLoginService: AuthLoginService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.authLoginService.validateCredentials(email, password);

    const roles = user.roles.map((userRole) => userRole.role.name);
    const { accessToken, refreshToken } = await this.generateTokenPair({
      user_id: user.id,
      entity_type: user.entity_type,
      roles,
    });

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

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto?.refresh_token;
    if (!refreshToken) {
      throw new Error('VALIDATION_ERROR');
    }

    let refreshPayload: any;
    try {
      refreshPayload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({ error: 'TOKEN_EXPIRED' });
      }
      throw new UnauthorizedException({ error: 'INVALID_TOKEN' });
    }

    const userId = refreshPayload?.user_id;
    if (!userId) {
      throw new UnauthorizedException({ error: 'INVALID_TOKEN' });
    }

    const refreshTokens = await this.authRepository.findRefreshTokensByUserId(userId);
    let matchedToken: any = null;
    for (const storedToken of refreshTokens) {
      const isMatch = await bcrypt.compare(refreshToken, storedToken.token_hash);
      if (isMatch) {
        matchedToken = storedToken;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException({ error: 'INVALID_TOKEN' });
    }

    if (matchedToken.revoked_at) {
      throw new UnauthorizedException({ error: 'TOKEN_REVOKED' });
    }

    if (new Date(matchedToken.expires_at).getTime() <= Date.now()) {
      throw new UnauthorizedException({ error: 'TOKEN_EXPIRED' });
    }

    const user = await this.authRepository.findUserById(userId);
    if (!user || !user.is_active || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException({ error: 'INVALID_TOKEN' });
    }

    const roles = user.roles.map((userRole) => userRole.role.name);
    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokenPair({
      user_id: user.id,
      entity_type: user.entity_type,
      roles,
    });

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    const newRefreshTokenExpiresAt = new Date();
    newRefreshTokenExpiresAt.setDate(newRefreshTokenExpiresAt.getDate() + 7);

    await this.authRepository.rotateRefreshToken(
      matchedToken.id,
      user.id,
      newRefreshTokenHash,
      newRefreshTokenExpiresAt,
    );

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 900,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;
    // Check if user already exists
    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new ForbiddenException({ error: 'USER_ALREADY_EXISTS', message: 'User already exists.' });
    }
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.authRepository.createUser(email, passwordHash);
    // Optionally send welcome email (not implemented)
    return { id: user.id, email: user.email };
  }

  async logout(userId: string, logoutDto: LogoutDto) {
    const refreshToken = logoutDto?.refresh_token;
    if (!refreshToken) {
      throw new Error('VALIDATION_ERROR');
    }

    const refreshTokens = await this.authRepository.findRefreshTokensByUserId(userId);
    for (const storedToken of refreshTokens) {
      const isMatch = await bcrypt.compare(refreshToken, storedToken.token_hash);
      if (isMatch) {
        await this.authRepository.revokeRefreshTokenById(storedToken.id);
        return { message: 'OK' };
      }
    }

    return { message: 'OK' };
  }

  async logoutAll(userId: string) {
    await this.authRepository.revokeAllActiveRefreshTokensByUserId(userId);
    return { message: 'OK' };
  }

  private async generateTokenPair(accessTokenPayload: {
    user_id: string;
    entity_type: string;
    roles: string[];
  }) {
    const refreshTokenPayload = {
      user_id: accessTokenPayload.user_id,
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

    return { accessToken, refreshToken };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException({ error: 'USER_NOT_FOUND' });
    }

    const isMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException({ error: 'INVALID_CURRENT_PASSWORD' });
    }

    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.authRepository.updatePassword(userId, newPasswordHash);

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      console.log(`Forgot password requested for non-existing email: ${email}`);
      return { message: 'If a user with that email exists, a reset code has been sent' };
    }
    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(resetCode, 12);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidate any existing unused tokens before issuing a new one
    const oldTokens = await this.authRepository.findUnusedResetTokensByUserId(user.id);
    for (const t of oldTokens) {
      await this.authRepository.markResetTokenAsUsed(t.id);
    }

    await this.authRepository.createPasswordResetToken(user.id, codeHash, expiresAt);
    await this.mailService.sendPasswordReset(email, resetCode);
    return { message: 'Password reset code sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, token, newPassword } = resetPasswordDto;

    // Scope lookup to the specific user — avoids scanning all users' tokens
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException({ error: 'INVALID_RESET_TOKEN' });
    }

    // Only fetch unused tokens for this user
    const unusedTokens = await this.authRepository.findUnusedResetTokensByUserId(user.id);
    if (unusedTokens.length === 0) {
      throw new UnauthorizedException({ error: 'INVALID_RESET_TOKEN' });
    }

    let matchedToken = null;
    for (const dbToken of unusedTokens) {
      // Skip expired tokens before doing the expensive bcrypt compare
      if (new Date(dbToken.expires_at).getTime() < Date.now()) continue;
      const isMatch = await bcrypt.compare(token, dbToken.token_hash);
      if (isMatch) {
        matchedToken = dbToken;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException({ error: 'INVALID_RESET_TOKEN' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await this.authRepository.updatePassword(user.id, newPasswordHash);
    await this.authRepository.markResetTokenAsUsed(matchedToken.id);
    await this.authRepository.revokeAllActiveRefreshTokensByUserId(user.id);

    return { message: 'Password reset successfully' };
  }
}
