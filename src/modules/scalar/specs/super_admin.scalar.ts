/**
 * super_admin.scalar.ts
 * ─────────────────────
 * ⚠️  INFERRED FILE — NOT BASED ON YOUR ACTUAL SOURCE.
 *
 * Your real `super_admin_scalar.ts` was referenced in two uploads but its
 * content was never actually included in either message — only its
 * filename appeared in the file list. Everything below is a best-effort
 * reconstruction following the same conventions as the other four specs,
 * built on the reasonable assumption that Super Admin = Admin + Academic
 * Manager scope, plus the one capability that's exclusive to this role
 * (role escalation to SUPER_ADMIN / ADMIN).
 *
 * Replace this file's `paths` with your real endpoints once you share the
 * actual source — the schemas, error catalog, and helper functions from
 * _shared.ts will still apply unchanged.
 */

import { ScalarDocument } from '../scalar.types';
import {
  bearerSecurityScheme,
  BEARER_SECURITY,
  commonSchemas,
  followUpCaseSchemas,
  commonErrorResponses,
  paginationParams,
  sortingParams,
  buildCodeSamples,
  TAG,
  ALL_SERVERS,
} from './_shared';

export const superAdminSwaggerDocument: ScalarDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Super Admin API Reference ⚠️ (inferred — verify against real backend)',
    version: '1.0.0',
    description: `
**⚠️ This document was reconstructed without access to the real source
file and should be verified against actual backend routes before publishing.**

Highest-privilege API surface. Superset of Admin + Academic Manager scope,
plus the ability to assign or revoke the \`SUPER_ADMIN\` and \`ADMIN\` roles
on any account — the one capability no other role can perform.

**Changelog**
- \`1.0.0\` (2026-06-27) — Initial documentation pass (inferred from sibling specs; pending verification).
`.trim(),
    contact: {
      name: 'Platform API Team',
      email: 'api-support@platform.example.com',
      url: 'https://platform.example.com/docs',
    },
  },
  servers: ALL_SERVERS,
  tags: [TAG.Auth, TAG.Users, TAG.Teachers, TAG.Students, TAG.FollowUps, TAG.Dashboard],
  components: {
    securitySchemes: { ...bearerSecurityScheme },
    schemas: { ...commonSchemas, ...followUpCaseSchemas },
  },
  paths: {
    '/auth/login': {
      post: {
        operationId: 'superAdminLogin',
        tags: [TAG.Auth.name],
        summary: 'Log in',
        description: 'Public endpoint. Exchanges email + password for an access/refresh token pair scoped to the Super Admin role.',
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Disable submit while in flight.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/auth/login', authenticated: false, body: { email: 'super.admin@platform.com', password: 'P@ssword123' } }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'super.admin@platform.com' },
                  password: { type: 'string', format: 'password', minLength: 8, example: 'P@ssword123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated successfully.', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'INTERNAL_ERROR']),
        },
      },
    },
    '/users': {
      get: {
        operationId: 'superAdminListUsers',
        tags: [TAG.Users.name],
        summary: 'List users',
        description: 'Identical scope to the Admin role\u2019s `GET /users` — included here for completeness so the Super Admin spec is self-sufficient.',
        ...BEARER_SECURITY,
        parameters: [
          ...paginationParams,
          ...sortingParams(['createdAt', 'email', 'role']),
          { name: 'role', in: 'query', required: false, schema: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'STUDENT'] } },
          { name: 'isActive', in: 'query', required: false, schema: { type: 'boolean' } },
        ],
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 30, retryOnFailure: true, supportsInfiniteScrolling: true },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/users?page=1&limit=20', authenticated: true }),
        responses: {
          '200': {
            description: 'Paginated user list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/UserEntity' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          ...commonErrorResponses(['UNAUTHORIZED', 'FORBIDDEN', 'INTERNAL_ERROR']),
        },
      },
    },
    '/users/{id}/role': {
      put: {
        operationId: 'assignUserRole',
        tags: [TAG.Users.name],
        summary: 'Assign a role',
        description:
          'The one capability exclusive to Super Admin: promote or demote any ' +
          'account to any role, including `SUPER_ADMIN` and `ADMIN`. Every other ' +
          'role is forbidden from setting these two values.',
        ...BEARER_SECURITY,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: 'a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }],
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Require a typed confirmation (e.g. re-enter the target email) before submitting — this is the single highest-blast-radius action in the whole API.' },
        'x-codeSamples': buildCodeSamples({ method: 'PUT', path: '/api/users/a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/role', authenticated: true, body: { role: 'ADMIN' } }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'STUDENT'], example: 'ADMIN', description: 'Required.' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Role updated.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/UserEntity' } } } } } },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_ERROR']),
        },
      },
    },
    '/dashboard': {
      get: {
        operationId: 'superAdminGetDashboardMetrics',
        tags: [TAG.Dashboard.name],
        summary: 'Get dashboard metrics',
        description: 'Same payload as the Admin role\u2019s dashboard endpoint.',
        ...BEARER_SECURITY,
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 60, retryOnFailure: true },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/dashboard', authenticated: true }),
        responses: {
          '200': {
            description: 'Current metrics snapshot.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', properties: { activeUsers: { type: 'integer', example: 450 }, activeCases: { type: 'integer', example: 12 } } },
                  },
                },
              },
            },
          },
          ...commonErrorResponses(['UNAUTHORIZED', 'FORBIDDEN', 'INTERNAL_ERROR']),
        },
      },
    },
  },
};