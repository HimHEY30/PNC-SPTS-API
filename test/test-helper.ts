// test/test-helper.ts — shared bootstrap for e2e tests
// Import this file in each *.e2e-spec.ts to get a running NestJS app + supertest agent.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '../src/common/filters';
import {
  LoggingInterceptor,
  TransformInterceptor,
} from '../src/common/interceptors';

export let app: INestApplication;
export let server: any;
export const prisma = new PrismaClient();

export function bootstrapApp() {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Apply same setup as main.ts
    const configService = app.get(ConfigService);
    const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
    app.setGlobalPrefix(apiPrefix);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TransformInterceptor(configService),
    );

    await app.init();

    server = request(app.getHttpServer());
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    if (app) {
      await app.close();
    }
  });
}
