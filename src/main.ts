import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as swaggerUi from 'swagger-ui-express';

const baseDoc = {
  openapi: '3.0.0',
  info: {
    title: 'PNC SPTS API',
    version: '1.0.0',
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  roleId: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { description: 'Bad Request' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout user',
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
  },
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');

  const swaggerDoc = {
    ...baseDoc,
    paths: Object.keys(baseDoc.paths).reduce((acc, key) => {
      acc[`/${apiPrefix}${key}`] = baseDoc.paths[key];
      return acc;
    }, {}),
  };

  app.use(`/${apiPrefix}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  app.use(`/${apiPrefix}/auth/reference`, swaggerUi.serve, swaggerUi.setup(swaggerDoc));

  app.setGlobalPrefix(apiPrefix);

  await app.listen(port);
}
bootstrap();
