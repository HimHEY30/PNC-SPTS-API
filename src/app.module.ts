import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { appConfig, appConfigValidationSchema } from './config/app.config';
import { databaseConfig, databaseConfigValidationSchema } from './config/database.config';
import { jwtConfig, jwtConfigValidationSchema } from './config/jwt.config';
import { redisConfig, redisConfigValidationSchema } from './config/redis.config';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { SwaggerModule } from './modules/swagger/swagger.module';
import { UsersModule } from './modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      validationSchema: Joi.object({
        ...appConfigValidationSchema,
        ...databaseConfigValidationSchema,
        ...jwtConfigValidationSchema,
        ...redisConfigValidationSchema,
      }),
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: parseInt(process.env.JWT_EXPIRATION) || 900 },
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    SwaggerModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
