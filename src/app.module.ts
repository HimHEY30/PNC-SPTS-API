import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { SwaggerController } from './modules/swagger/swagger.controller';

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
    DatabaseModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController, SwaggerController],
  providers: [AppService],
})
export class AppModule {}
