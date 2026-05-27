import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

/**
 * Thrown when request data fails manual validation checks beyond class-validator.
 * Maps to HTTP 400 Bad Request.
 *
 * @example
 * throw new ValidationException('INVALID_DATE_RANGE', 'Start date must be before end date.', { field: 'start_date' });
 */
export class ValidationException extends AppException {
  constructor(
    errorCode: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, message, HttpStatus.BAD_REQUEST, details);
  }
}
