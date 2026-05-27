import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base application exception.
 * All custom exceptions should extend this class.
 */
export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly details?: Record<string, unknown>,
  ) {
    super(
      {
        statusCode,
        error: errorCode,
        message,
        ...(details ? { details } : {}),
      },
      statusCode,
    );
  }
}
