import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

/**
 * Logs every incoming HTTP request and its response time.
 *
 * Output format (single line per request):
 *   [LoggingInterceptor] GET /api/users 200 — 42ms
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - start;
          this.logger.log(
            `${method} ${url} ${response.statusCode} — ${elapsed}ms`,
          );
        },
        error: () => {
          // Errors are logged by the HttpExceptionFilter; skip here to avoid duplication.
        },
      }),
    );
  }
}
