/**
 * scalar.module.ts
 * ────────────────
 * NestJS module that wires together the Scalar documentation controller
 * and service.
 *
 * No changes to the module structure are required; this file is kept
 * in sync with the updated controller/service for clarity.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScalarController } from './scalar.controller';
import { ScalarDocsService } from './scalar-docs.service';

@Module({
  imports: [ConfigModule],
  controllers: [ScalarController],
  providers: [ScalarDocsService],
  exports: [ScalarDocsService],
})
export class ScalarModule {}