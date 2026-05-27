import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

/**
 * Thrown when a requested resource cannot be found.
 * Maps to HTTP 404 Not Found.
 *
 * @example
 * throw new ResourceNotFoundException('USER_NOT_FOUND', 'User with the given ID was not found.');
 */
export class ResourceNotFoundException extends AppException {
  constructor(
    errorCode: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, message, HttpStatus.NOT_FOUND, details);
  }
}
