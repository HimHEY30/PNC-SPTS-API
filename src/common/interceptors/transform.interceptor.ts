import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';

/**
 * Wraps every successful controller response in a standard envelope:
 *
 * {
 *   statusCode: number,
 *   success:    true,
 *   data:       <original response value>,
 *   timestamp:  string
 * }
 *
 * If the controller already returns an envelope (has a `statusCode` key) the
 * interceptor passes it through unchanged to avoid double-wrapping.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        // Don't double-wrap if the handler already returns a shaped envelope.
        if (
          data !== null &&
          typeof data === 'object' &&
          'statusCode' in (data as object)
        ) {
          return data;
        }

        return {
          statusCode: response.statusCode,
          success: true,
          data: data ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
