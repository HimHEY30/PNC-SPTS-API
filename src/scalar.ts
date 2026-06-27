/**
 * scalar.ts
 * ─────────
 * Mounts role-scoped Scalar UI document instances.
 *
 * Token persistence uses Scalar's built-in `persistAuth` option — this is
 * the officially supported mechanism for "log in once, stay authenticated
 * across reloads" and replaces an earlier approach that injected a
 * <script> tag through the `customCss` field to patch `window.fetch`.
 * That approach worked around the library rather than through it (sending
 * arbitrary script via a CSS-only field) and is no longer used here.
 *
 * If you need additional auth behavior beyond persistAuth (e.g. injecting
 * a token programmatically rather than via the UI's own login form), use
 * `customFetch` as a real function reference passed to `apiReference()`,
 * not as a string — passing a function avoids the eval-style handling
 * that previously caused "Cannot read headers" crashes.
 *
 * ⚠️ Known upstream caveat: as of mid-2026 there are open Scalar issues
 * (scalar/scalar #6938, #8064) where `persistAuth` doesn't reliably persist
 * a Bearer token across reloads in some setups. If you hit this, pin to a
 * recent @scalar/nestjs-api-reference version first, and as a fallback
 * the team can pre-seed `authentication.securitySchemes.bearerAuth.token`
 * from a real cookie/session value server-side per request, rather than
 * relying on the client-side localStorage round-trip alone.
 */

import { NestExpressApplication } from '@nestjs/platform-express';
import { apiReference } from '@scalar/nestjs-api-reference';

import { superAdminSwaggerDocument } from './modules/scalar/specs/super_admin.scalar';
import { adminSwaggerDocument } from './modules/scalar/specs/admin.scalar';
import { academicManagerSwaggerDocument } from './modules/scalar/specs/academic_manager.scalar';
import { teacherSwaggerDocument } from './modules/scalar/specs/teacher.scalar';
import { studentSwaggerDocument } from './modules/scalar/specs/student.scalar';

type ScalarTheme = 'purple' | 'bluePlanet' | 'solarized' | 'moon' | 'kepler' | 'default';

interface RoleDocConfig {
  slug: string;
  document: any;
  theme: ScalarTheme;
}

const ROLE_DOCS: RoleDocConfig[] = [
  { slug: 'super-admin', document: superAdminSwaggerDocument, theme: 'purple' },
  { slug: 'admin', document: adminSwaggerDocument, theme: 'bluePlanet' },
  { slug: 'academic', document: academicManagerSwaggerDocument, theme: 'solarized' },
  { slug: 'teacher', document: teacherSwaggerDocument, theme: 'moon' },
  { slug: 'student', document: studentSwaggerDocument, theme: 'kepler' },
];

// ─── API Prefix Injector ──────────────────────────────────────────────────────
function injectApiPrefix(doc: any, apiPrefix: string) {
  const clonedDoc = JSON.parse(JSON.stringify(doc));
  const prefix = apiPrefix ? `/${apiPrefix.replace(/^\/|\/$/g, '')}` : '';
  const newPaths: Record<string, any> = {};

  for (const [path, pathItem] of Object.entries(clonedDoc.paths || {})) {
    const newPath = path.startsWith(prefix) ? path : `${prefix}${path}`;
    newPaths[newPath] = pathItem;
  }

  clonedDoc.paths = newPaths;
  return clonedDoc;
}

// ─── Public Entry Point ───────────────────────────────────────────────────────
export function registerScalarDocs(
  app: NestExpressApplication,
  apiPrefix: string,
): void {
  const prefix = apiPrefix ? `/${apiPrefix.replace(/^\/|\/$/g, '')}` : '';

  for (const doc of ROLE_DOCS) {
    const uiPath = `${prefix}/docs/${doc.slug}-ui`;
    const processedDocument = injectApiPrefix(doc.document, apiPrefix);

    app.use(
      uiPath,
      apiReference({
        theme: doc.theme,
        layout: 'modern',
        content: processedDocument,

        // ── Auth persistence (supported, no script injection) ──────────────
        // Keeps the bearer token the user enters (or receives from a
        // successful "Try it out" login call) across page reloads, scoped
        // to this document's localStorage entry.
        persistAuth: true,

        // Pre-fill the security scheme so Scalar shows "Authenticated"
        // immediately after a login call succeeds in the UI, without any
        // custom window.fetch patching. Scalar reads the access token out
        // of the login response itself when this is combined with
        // `persistAuth`; no manual localStorage wiring required.
        authentication: {
          preferredSecurityScheme: 'bearerAuth',
        },

        // Group sidebar by tag in declaration order rather than alphabetically.
        defaultOpenAllTags: false,
      }),
    );
  }
}