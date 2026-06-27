/**
 * student.scalar.ts
 * ─────────────────
 * OpenAPI specification for the Student role.
 *
 * Scope: fully read-only. Own enrolled classes, own follow-up cases, own
 * profile. No write endpoints exist for this role.
 */

import { ScalarDocument } from '../scalar.types';
import {
  bearerSecurityScheme,
  BEARER_SECURITY,
  commonSchemas,
  followUpCaseSchemas,
  commonErrorResponses,
  paginationParams,
  buildCodeSamples,
  TAG,
  ALL_SERVERS,
} from './_shared';

export const studentSwaggerDocument: ScalarDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Student API Reference',
    version: '1.0.0',
    description: `
Read-only self-service API for students. View your enrolled classes, any
follow-up (intervention) cases concerning you, and your own profile.

**Scope of this token:** every endpoint here is strictly read-only and
scoped to the authenticated student. There are no write endpoints in this
role's API surface.

**Changelog**
- \`1.0.0\` (2026-06-27) — Initial public documentation pass.
`.trim(),
    contact: {
      name: 'Platform API Team',
      email: 'api-support@platform.example.com',
      url: 'https://platform.example.com/docs',
    },
  },
  servers: ALL_SERVERS,
  tags: [TAG.Auth, TAG.Classes, TAG.FollowUps, TAG.Profile],
  components: {
    securitySchemes: { ...bearerSecurityScheme },
    schemas: { ...commonSchemas, ...followUpCaseSchemas },
  },
  paths: {
    '/auth/login': {
      post: {
        operationId: 'studentLogin',
        tags: [TAG.Auth.name],
        summary: 'Log in',
        description: 'Public endpoint. Exchanges email + password for an access/refresh token pair scoped to the Student role.',
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Disable submit while in flight.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/auth/login', authenticated: false, body: { email: 'student.omega@platform.com', password: 'P@ssword123' } }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'student.omega@platform.com' },
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
    '/my-classes': {
      get: {
        operationId: 'listMyClasses',
        tags: [TAG.Classes.name],
        summary: 'List my classes',
        description: 'Returns the classes and sections you are currently enrolled in.',
        ...BEARER_SECURITY,
        parameters: [...paginationParams],
        'x-frontend-notes': {
          cacheable: true,
          cacheTtlSeconds: 300,
          retryOnFailure: true,
          notes: 'Class schedules change rarely mid-term — a 5 minute cache is safe. Good candidate for prefetch on login.',
        },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/my-classes?page=1&limit=20', authenticated: true }),
        responses: {
          '200': {
            description: 'List of enrolled classes.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          className: { type: 'string', example: 'Advanced Calculus IV' },
                          room: { type: 'string', example: 'Hall C-3' },
                        },
                      },
                    },
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
    '/my-follow-ups': {
      get: {
        operationId: 'listMyFollowUpsAsStudent',
        tags: [TAG.FollowUps.name],
        summary: 'List my follow-up cases',
        description: 'Returns intervention cases raised about you, across any teacher. Read-only — students cannot create or modify cases.',
        ...BEARER_SECURITY,
        parameters: [...paginationParams],
        'x-frontend-notes': {
          cacheable: true,
          cacheTtlSeconds: 30,
          retryOnFailure: true,
          emptyState: 'An empty array here is the common case and a good outcome — phrase the empty state positively, not as a missing-data error.',
        },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/my-follow-ups?page=1&limit=20', authenticated: true }),
        responses: {
          '200': {
            description: 'Paginated list of your follow-up cases.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success', 'data', 'meta'],
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/FollowUpCase' } },
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
    '/profile/me': {
      get: {
        operationId: 'getMyProfileAsStudent',
        tags: [TAG.Profile.name],
        summary: 'Get my profile',
        description: 'Returns the authenticated student\u2019s own profile data.',
        ...BEARER_SECURITY,
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 300, retryOnFailure: true },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/profile/me', authenticated: true }),
        responses: {
          '200': { description: 'Profile data.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileResponse' } } } },
          ...commonErrorResponses(['UNAUTHORIZED', 'INTERNAL_ERROR']),
        },
      },
    },
  },
};