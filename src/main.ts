import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as swaggerUi from 'swagger-ui-express';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global exception filter ──────────────────────────────────────────────
  // Catches every thrown exception and returns a consistent JSON error body.
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global interceptors (order matters: outer → inner) ───────────────────
  // 1. LoggingInterceptor  – logs method, path, status, and elapsed time.
  // 2. TransformInterceptor – wraps successful responses in { statusCode, success, data, timestamp }.
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  app.getHttpAdapter().get(`/${apiPrefix}/docs-auto-auth.js`, (_req: Request, res: Response) => {
    res.type('application/javascript').send(`
      (function() {
        const TOKEN_KEY = 'swagger_auto_bearer_token';
        function applySwaggerAuth(token) {
          if (!token || !window.ui || typeof window.ui.preauthorizeApiKey !== 'function') return;
          try {
            window.ui.preauthorizeApiKey('bearerAuth', token);
          } catch (_) {}
        }

        applySwaggerAuth(localStorage.getItem(TOKEN_KEY));
        const originalFetch = window.fetch.bind(window);

        window.fetch = async function(input, init) {
          const reqUrl = typeof input === 'string' ? input : (input && input.url) || '';
          const requestInit = init || {};
          const headers = new Headers(requestInit.headers || {});
          const token = localStorage.getItem(TOKEN_KEY);

          if (token && reqUrl.includes('/api/') && !reqUrl.includes('/api/auth/login') && !reqUrl.includes('/api/auth/refresh') && !headers.has('Authorization')) {
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
                applySwaggerAuth(accessToken);
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
    swaggerUi.serveFiles(undefined, {
      swaggerOptions: {
        persistAuthorization: true,
        url: `/${apiPrefix}/docs-json`,
      },
      customJs: `/${apiPrefix}/docs-auto-auth.js`,
    }),
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        persistAuthorization: true,
        url: `/${apiPrefix}/docs-json`,
      },
      customJs: `/${apiPrefix}/docs-auto-auth.js`,
    }),
  );

  app.use(
    `/${apiPrefix}/auth/reference`,
    swaggerUi.serveFiles(undefined, {
      swaggerOptions: {
        persistAuthorization: false,
        url: `/${apiPrefix}/auth/reference-json`,
      },
    }),
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        persistAuthorization: false,
        url: `/${apiPrefix}/auth/reference-json`,
      },
    }),
  );

  await app.listen(port);
}
bootstrap();
