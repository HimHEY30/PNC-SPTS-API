/**
 * scalar-docs.service.ts
 * ──────────────────────
 * Serves the per-role OpenAPI JSON documents.
 *
 * Each document is returned with the global API prefix prepended to every
 * path (e.g. /users → /api/users) so Scalar's "Try it out" calls hit the
 * correct URL automatically.
 *
 * URL map (all under GET /api/docs/*):
 *   /api/docs/super-admin   → Super Admin spec
 *   /api/docs/admin         → Admin spec
 *   /api/docs/academic      → Academic Manager spec
 *   /api/docs/teacher       → Teacher spec
 *   /api/docs/student       → Student spec
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { superAdminSwaggerDocument } from './specs/super_admin.scalar';
import { adminSwaggerDocument } from './specs/admin.scalar';
import { academicManagerSwaggerDocument } from './specs/academic_manager.scalar';
import { teacherSwaggerDocument } from './specs/teacher.scalar';
import { studentSwaggerDocument } from './specs/student.scalar';
import { enhanceScalarDocument } from './specs/_shared';

import { ScalarDocument } from './scalar.types';

@Injectable()
export class ScalarDocsService {
  constructor(private readonly configService: ConfigService) {}

  // ── Role document accessors ──────────────────────────────────────────────

  getSuperAdminDocument(): ScalarDocument {
    return this.withRuntimeConfig(superAdminSwaggerDocument);
  }
  getAdminDocument(): ScalarDocument {
    return this.withRuntimeConfig(adminSwaggerDocument);
  }
  getAcademicDocument(): ScalarDocument {
    return this.withRuntimeConfig(academicManagerSwaggerDocument);
  }
  getTeacherDocument(): ScalarDocument {
    return this.withRuntimeConfig(teacherSwaggerDocument);
  }
  getStudentDocument(): ScalarDocument {
    return this.withRuntimeConfig(studentSwaggerDocument);
  }

  // ── Prefix helper ────────────────────────────────────────────────────────

  /**
   * Prepends the configured API prefix (default: "api") to every path in the
   * document, and overwrites `servers[].url` with the configured base URL,
   * so that Scalar generates correct request URLs automatically regardless
   * of environment (dev/staging/prod).
   *
   * Input path:   /users
   * Output path:  /api/users
   */
  private withRuntimeConfig(doc: ScalarDocument): ScalarDocument {
    const apiPrefix = this.configService.get<string>('app.apiPrefix', 'api');
    const baseUrl = this.configService.get<string>(
      'app.baseUrl',
      'http://localhost:3000',
    );

    return enhanceScalarDocument({
      ...doc,
      servers: (doc.servers ?? []).map((server) => ({
        ...server,
        url: baseUrl.replace(/\/$/, ''),
      })),
      paths: Object.fromEntries(
        Object.entries(doc.paths).map(([path, pathItem]) => [
          `/${apiPrefix}${path}`,
          pathItem,
        ]),
      ),
    }) as ScalarDocument;
  }
}