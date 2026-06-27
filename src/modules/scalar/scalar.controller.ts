/**
 * scalar.controller.ts
 * ────────────────────
 * Exposes per-role OpenAPI JSON documents.
 *
 * All endpoints are PUBLIC (no JWT required) so the frontend team and
 * Scalar UI can fetch them without authentication.
 *
 * Routes (relative to the global API prefix, e.g. /api/docs/...):
 *
 *   GET /docs/super-admin    → Super Admin OpenAPI JSON
 *   GET /docs/admin          → Admin OpenAPI JSON
 *   GET /docs/academic       → Academic Manager OpenAPI JSON
 *   GET /docs/teacher        → Teacher OpenAPI JSON
 *   GET /docs/student        → Student OpenAPI JSON
 */

import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ScalarDocsService } from './scalar-docs.service';

@Controller('docs')
export class ScalarController {
  constructor(private readonly scalarDocsService: ScalarDocsService) {}

  // ── Super Admin ───────────────────────────────────────────────────────────

  /** GET /api/docs/super-admin */
  @Get('super-admin')
  @Public()
  getSuperAdminSpec(@Res() res: Response): void {
    res.json(this.scalarDocsService.getSuperAdminDocument());
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** GET /api/docs/admin */
  @Get('admin')
  @Public()
  getAdminSpec(@Res() res: Response): void {
    res.json(this.scalarDocsService.getAdminDocument());
  }

  // ── Academic Manager ──────────────────────────────────────────────────────

  /** GET /api/docs/academic */
  @Get('academic')
  @Public()
  getAcademicSpec(@Res() res: Response): void {
    res.json(this.scalarDocsService.getAcademicDocument());
  }

  // ── Teacher ───────────────────────────────────────────────────────────────

  /** GET /api/docs/teacher */
  @Get('teacher')
  @Public()
  getTeacherSpec(@Res() res: Response): void {
    res.json(this.scalarDocsService.getTeacherDocument());
  }

  // ── Student ───────────────────────────────────────────────────────────────

  /** GET /api/docs/student */
  @Get('student')
  @Public()
  getStudentSpec(@Res() res: Response): void {
    res.json(this.scalarDocsService.getStudentDocument());
  }
}