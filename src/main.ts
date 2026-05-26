import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as swaggerUi from 'swagger-ui-express';
import { Request, Response } from 'express';

const baseSwaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'PNC SPTS API',
    version: '1.0.0',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
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
                  email: { type: 'string', example: 'newuser@example.com' },
                  password: { type: 'string', example: 'Password123' },
                  roleId: { type: 'string', example: 'role-id-here' },
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
    '/user/profile': {
      get: {
        summary: 'Get user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User profile returned' },
          '401': { description: 'Unauthorized' },
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
    ...baseSwaggerDoc,
    paths: Object.fromEntries(
      Object.entries(baseSwaggerDoc.paths).map(([path, pathItem]) => [`/${apiPrefix}${path}`, pathItem]),
    ),
  };

  app.setGlobalPrefix(apiPrefix);
  app.getHttpAdapter().get(`/${apiPrefix}/docs-auto-auth.js`, (_req: Request, res: Response) => {
    res.type('application/javascript').send(`
      (function() {
        const TOKEN_KEY = 'swagger_auto_bearer_token';
        const originalFetch = window.fetch.bind(window);

        window.fetch = async function(input, init) {
          const reqUrl = typeof input === 'string' ? input : (input && input.url) || '';
          const requestInit = init || {};
          const headers = new Headers(requestInit.headers || {});
          const token = localStorage.getItem(TOKEN_KEY);

          if (token && reqUrl.includes('/api/') && !reqUrl.includes('/api/auth/login') && !headers.has('Authorization')) {
            headers.set('Authorization', 'Bearer ' + token);
          }

          const response = await originalFetch(input, { ...requestInit, headers });

          if (reqUrl.includes('/api/auth/login') && response.ok) {
            try {
              const clone = response.clone();
              const payload = await clone.json();
              const accessToken = payload && (payload.access_token || payload.token);
              if (accessToken) {
                localStorage.setItem(TOKEN_KEY, accessToken);
              }
            } catch (_) {}
          }

          return response;
        };
      })();
    `);
  });
  app.use(
    `/${apiPrefix}/docs`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDoc, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customJs: `/${apiPrefix}/docs-auto-auth.js`,
    }),
  );

  await app.listen(port);
}
bootstrap();
