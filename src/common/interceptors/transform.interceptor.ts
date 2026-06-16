import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';
import { toLiveImageUrl } from '../../config/storage.config';

function transformImages(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformImages);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if ((key === 'profile_image' || key === 'profileImage') && typeof value === 'string') {
      result[key] = toLiveImageUrl(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = transformImages(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

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
        const transformedData = transformImages(data);

        // Don't double-wrap if the handler already returns a shaped envelope.
        if (transformedData !== null && typeof transformedData === 'object' && 'statusCode' in transformedData) {
          return transformedData;
        }

        return {
          statusCode: response.statusCode,
          success: true,
          data: transformedData ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
