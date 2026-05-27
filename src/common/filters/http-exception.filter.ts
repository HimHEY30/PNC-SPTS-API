import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter.
 *
 * Catches ALL exceptions (HttpException and unexpected errors) and returns
 * a consistent JSON error envelope:
 * {
 *   statusCode: number,
 *   error:      string,
 *   message:    string | string[],
 *   timestamp:  string,
 *   path:       string,
 *   details?:   object      // only when present
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'INTERNAL_SERVER_ERROR';
    let message: string | string[] = 'An unexpected error occurred.';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse() as Record<string, unknown> | string;

      if (typeof body === 'string') {
        message = body;
        error = this.statusToErrorCode(statusCode);
      } else {
        // NestJS ValidationPipe produces { message: string[], error: string }
        message = (body.message as string | string[]) ?? exception.message;
        error =
          (body.error as string) ??
          this.statusToErrorCode(statusCode);
        details = body.details as Record<string, unknown> | undefined;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      message = exception.message;
    } else {
      this.logger.error(
        `Unknown exception on ${request.method} ${request.url}`,
        JSON.stringify(exception),
      );
    }

    const responseBody: Record<string, unknown> = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (details) {
      responseBody.details = details;
    }

    response.status(statusCode).json(responseBody);
  }

  /** Map an HTTP status code to a short error-code string. */
  private statusToErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      410: 'GONE',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] ?? 'HTTP_ERROR';
  }
}
