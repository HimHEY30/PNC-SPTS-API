/**
 * prisma-exception.filter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * B-02 — Global exception filter that intercepts Prisma client errors and
 * converts them into clean NestJS HTTP responses.
 *
 * REGISTER IN main.ts:
 *   import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
 *   app.useGlobalFilters(new PrismaExceptionFilter());
 *
 * Handled codes
 * ─────────────
 * P2002  Unique constraint violation → 409 Conflict
 * P2025  Record not found            → 404 Not Found
 * P2003  Foreign key constraint fail → 400 Bad Request
 * P2014  Relation violation          → 400 Bad Request
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      `Prisma error ${exception.code}: ${exception.message}`,
    );

    switch (exception.code) {
      case 'P2002': {
        // Extract the field(s) that caused the unique violation if available
        const fields =
          (exception.meta?.target as string[] | undefined)?.join(', ') ??
          'field';
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: `A record with this ${fields} already exists.`,
          prisma_code: exception.code,
        });
      }

      case 'P2025':
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'The requested record does not exist.',
          prisma_code: exception.code,
        });

      case 'P2003':
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'A related record could not be found (foreign key violation).',
          prisma_code: exception.code,
        });

      case 'P2014':
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'The change violates a required relation.',
          prisma_code: exception.code,
        });

      default:
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'A database error occurred.',
          prisma_code: exception.code,
        });
    }
  }
}
