import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors';
import { registerScalarDocs } from './scalar';

async function bootstrap() {
  // 1. Initialize NestJS application with the Express platform adapter
  const app           = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port          = configService.get<number>('app.port', 3000);
  const apiPrefix     = configService.get<string>('app.apiPrefix', 'api');

  // 1.5 Enable CORS to prevent browser network blocks in the Scalar UI testing interface
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 2. Static Assets Servicing
  // Exposes files located in <root>/uploads via GET /uploads/* paths
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // 3. Set Global Routing Prefix (e.g., /api)
  app.setGlobalPrefix(apiPrefix);

  // 4. Input DTO Validation Pipes
  app.useGlobalPipes(
    new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true 
    }),
  );

  // 5. Global Architecture Interceptors & Exception Filters
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(configService),
  );

  // 6. Multi-Role Documentation Wiring (Scalar UI Generation)
  // Generates JSON specs and mounts user interfaces at /api/docs/*-ui
  registerScalarDocs(app, apiPrefix);

  // 7. Start HTTP Server Listener
  await app.listen(port);
}

bootstrap();