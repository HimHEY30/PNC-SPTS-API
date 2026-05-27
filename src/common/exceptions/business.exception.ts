import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

/**
 * Thrown when a business rule is violated.
 * Maps to HTTP 422 Unprocessable Entity.
 *
 * @example
 * throw new BusinessException('STUDENT_ALREADY_ENROLLED', 'Student is already enrolled in this course.');
 */
export class BusinessException extends AppException {
  constructor(
    errorCode: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}
