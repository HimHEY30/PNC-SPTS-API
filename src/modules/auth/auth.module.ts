import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { MailModule } from '../mail/mail.module';
import { AuthLoginService } from './auth-login.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    MailModule,
  ],
  providers: [AuthService, AuthRepository, AuthLoginService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
