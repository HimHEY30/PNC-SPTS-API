import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  UnprocessableEntityException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    // Create the user via AuthService and return the result
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'VALIDATION_ERROR') {
        throw new UnprocessableEntityException({ error: 'VALIDATION_ERROR' });
      }
      throw error;
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.authService.refresh(refreshTokenDto);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'VALIDATION_ERROR') {
        throw new UnprocessableEntityException({ error: 'VALIDATION_ERROR' });
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Body() logoutDto: LogoutDto) {
    try {
      return await this.authService.logout(this.getAuthenticatedUserId(req), logoutDto);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'VALIDATION_ERROR') {
        throw new UnprocessableEntityException({ error: 'VALIDATION_ERROR' });
      }
      throw error;
    }
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: Request) {
    return this.authService.logoutAll(this.getAuthenticatedUserId(req));
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(this.getAuthenticatedUserId(req), changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  private getAuthenticatedUserId(req: Request): string {
    const userId = req.user?.user_id;
    if (!userId) {
      throw new UnauthorizedException({ error: 'MISSING_TOKEN' });
    }
    return String(userId);
  }
}
