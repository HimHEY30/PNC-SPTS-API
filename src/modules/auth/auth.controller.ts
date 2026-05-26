import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      if (error.message === 'VALIDATION_ERROR') {
        throw new UnprocessableEntityException({ error: 'VALIDATION_ERROR' });
      }
      throw error;
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      if (error.message === 'VALIDATION_ERROR') {
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
    } catch (error) {
      if (error.message === 'VALIDATION_ERROR') {
        throw new UnprocessableEntityException({ error: 'VALIDATION_ERROR' });
      }
      throw error;
    }
  }
}
