/**
 * teacher.scalar.ts
 * ─────────────────
 * OpenAPI specification for the Teacher role.
 *
 * Scope: own classroom roster (read-only), own follow-up cases (full CRUD
 * on cases they raise/are assigned), and their own profile.
 *
 * Every operation includes: operationId, full parameter docs, every
 * documented error this endpoint can actually return, multi-language
 * code samples (x-codeSamples), and frontend integration notes
 * (x-frontend-notes) — cacheability, retry behavior, pagination strategy.
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

export const teacherSwaggerDocument: ScalarDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Teacher API Reference',
    version: '1.0.0',
    description: `
Faculty-facing API for managing your own classroom roster and raising or
tracking student follow-up (intervention) cases.

**Scope of this token:** every endpoint here is scoped to the authenticated
teacher. There is no way to read or modify another teacher's students or
cases through this role — those calls will return \`403 FORBIDDEN\`.

**Changelog**
- \`1.0.0\` (2026-06-27) — Initial public documentation pass: full error
  catalog, pagination, and code samples added to every endpoint.
`.trim(),
    contact: {
      name: 'Platform API Team',
      email: 'api-support@platform.example.com',
      url: 'https://platform.example.com/docs',
    },
  },
  servers: ALL_SERVERS,
  tags: [TAG.Auth, TAG.Students, TAG.FollowUps, TAG.Profile],
  components: {
    securitySchemes: { ...bearerSecurityScheme },
    schemas: { ...commonSchemas, ...followUpCaseSchemas },
  },
  paths: {
    '/auth/login': {
      post: {
        operationId: 'teacherLogin',
        tags: [TAG.Auth.name],
        summary: 'Log in',
        description:
          'Public endpoint. Exchanges email + password for an access/refresh ' +
          'token pair. The returned `user.role` confirms which role-scoped API ' +
          'surface the token is valid for.',
        'x-frontend-notes': {
          cacheable: false,
          retryOnFailure: false,
          notes: 'Disable the submit button while in flight. On success, store accessToken in memory and refreshToken in secure storage (httpOnly cookie preferred on web).',
        },
        'x-codeSamples': buildCodeSamples({
          method: 'POST',
          path: '/api/auth/login',
          authenticated: false,
          body: { email: 'teacher.alpha@platform.com', password: 'P@ssword123' },
        }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'teacher.alpha@platform.com', description: 'Must be a registered, active account.' },
                  password: { type: 'string', format: 'password', minLength: 8, example: 'P@ssword123', description: 'Min 8 characters. Sent over TLS only.' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated successfully.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'INTERNAL_ERROR']),
        },
      },
    },
    '/auth/refresh': {
      post: {
        operationId: 'teacherRefreshToken',
        tags: [TAG.Auth.name],
        summary: 'Refresh access token',
        description:
          'Exchanges a valid, unexpired refresh token for a new access token. ' +
          'Call this proactively on a timer (e.g. every 10 minutes) or reactively ' +
          'on the first `401 UNAUTHORIZED` your app receives.',
        'x-frontend-notes': {
          cacheable: false,
          retryOnFailure: false,
          notes: 'If this call itself returns 401, the refresh token has expired — clear session and force re-login. Do not loop.',
        },
        'x-codeSamples': buildCodeSamples({
          method: 'POST',
          path: '/api/auth/refresh',
          authenticated: false,
          body: { refreshToken: '<refresh_token>' },
        }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'New access token issued.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshResponse' } } },
          },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'INTERNAL_ERROR']),
        },
      },
    },
    '/auth/logout': {
      post: {
        operationId: 'teacherLogout',
        tags: [TAG.Auth.name],
        summary: 'Log out',
        description: 'Revokes the current refresh token server-side. The access token remains technically valid until its natural 15-minute expiry, so also discard it client-side immediately.',
        ...BEARER_SECURITY,
        'x-frontend-notes': {
          cacheable: false,
          retryOnFailure: false,
          notes: 'Clear all local/session storage and in-memory tokens regardless of the response — treat this as fire-and-forget on the client.',
        },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/auth/logout', authenticated: true }),
        responses: {
          '200': { description: 'Session revoked.' },
          ...commonErrorResponses(['UNAUTHORIZED', 'INTERNAL_ERROR']),
        },
      },
    },
    '/my-students': {
      get: {
        operationId: 'listMyStudents',
        tags: [TAG.Students.name],
        summary: 'List my students',
        description: 'Read-only roster of students enrolled in classes you teach. Permissions: Teacher only.',
        ...BEARER_SECURITY,
        parameters: [...paginationParams, ...sortingParams(['enrollmentNumber', 'status'])],
        'x-frontend-notes': {
          cacheable: true,
          cacheTtlSeconds: 60,
          retryOnFailure: true,
          supportsInfiniteScrolling: true,
          paginationStrategy: 'Use `meta.hasNextPage` to decide whether to request the next page; do not infer from `data.length < limit`.',
          loadingState: 'Show skeleton rows matching `limit` count, not a spinner, to avoid layout shift.',
          emptyState: 'New teachers with no assigned classes will get an empty array, not an error — design for zero state explicitly.',
        },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/my-students?page=1&limit=20', authenticated: true }),
        responses: {
          '200': {
            description: 'Paginated list of students in your classes.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success', 'data', 'meta'],
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/StudentEntity' } },
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
        operationId: 'listMyFollowUps',
        tags: [TAG.FollowUps.name],
        summary: 'List my follow-up cases',
        description: 'Returns follow-up cases you created or are assigned to. Supports filtering by status and priority. Permissions: Teacher only.',
        ...BEARER_SECURITY,
        parameters: [
          ...paginationParams,
          ...sortingParams(['createdAt', 'updatedAt', 'priority']),
          { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'] }, description: 'Filter by case status.' },
          { name: 'priority', in: 'query', required: false, schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }, description: 'Filter by priority.' },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: 'Free-text match against case title.' },
        ],
        'x-frontend-notes': {
          cacheable: true,
          cacheTtlSeconds: 30,
          retryOnFailure: true,
          supportsOptimisticUpdates: true,
          debounceRecommendationMs: 300,
          notes: 'Debounce the `search` param at 300ms. Combine `status`+`priority` filters client-side into the same query rather than separate calls.',
        },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/my-follow-ups?page=1&limit=20&status=OPEN', authenticated: true }),
        responses: {
          '200': {
            description: 'Paginated list of follow-up cases.',
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
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'INTERNAL_ERROR']),
        },
      },
      post: {
        operationId: 'createFollowUp',
        tags: [TAG.FollowUps.name],
        summary: 'Raise a new follow-up case',
        description: 'Creates an intervention case against a student in one of your classes. Permissions: Teacher only — `studentId` must belong to a student you teach, or this returns `403 FORBIDDEN`.',
        ...BEARER_SECURITY,
        'x-frontend-notes': {
          cacheable: false,
          retryOnFailure: false,
          supportsOptimisticUpdates: true,
          notes: 'Safe to optimistically insert into the local list with status OPEN; reconcile with the server `id` and `createdAt` on response. Do not retry automatically on failure — could create duplicates.',
        },
        'x-codeSamples': buildCodeSamples({
          method: 'POST',
          path: '/api/my-follow-ups',
          authenticated: true,
          body: { title: 'Missing Homework Assignment Chain', description: 'Three consecutive missed submissions.', studentId: 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f', priority: 'MEDIUM' },
        }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'studentId', 'priority'],
                properties: {
                  title: { type: 'string', minLength: 3, maxLength: 120, example: 'Missing Homework Assignment Chain', description: 'Required. 3–120 chars.' },
                  description: { type: 'string', nullable: true, maxLength: 2000, example: 'Three consecutive missed submissions.', description: 'Optional. Max 2000 chars.' },
                  studentId: { type: 'string', format: 'uuid', example: 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f', description: 'Required. Must be a student in one of your classes.' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'MEDIUM', description: 'Required. Teachers cannot set CRITICAL — that tier is reserved for Academic Managers.' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Case created with status `OPEN`.',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/FollowUpCase' } } } } },
          },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_ERROR']),
        },
      },
    },
    '/my-follow-ups/{id}': {
      get: {
        operationId: 'getFollowUpById',
        tags: [TAG.FollowUps.name],
        summary: 'Get a follow-up case by id',
        description: 'Permissions: Teacher only, and only for cases you created or are assigned to.',
        ...BEARER_SECURITY,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Follow-up case id.', example: 'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a' }],
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 30, retryOnFailure: true },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/my-follow-ups/d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a', authenticated: true }),
        responses: {
          '200': {
            description: 'Case found.',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/FollowUpCase' } } } } },
          },
          ...commonErrorResponses(['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_ERROR']),
        },
      },
      put: {
        operationId: 'updateFollowUp',
        tags: [TAG.FollowUps.name],
        summary: 'Update a follow-up case',
        description:
          'Updates status and/or appends notes. Permissions: Teacher only, on cases you own. ' +
          'Valid status transitions: `OPEN → IN_PROGRESS → RESOLVED`. Skipping a step ' +
          '(e.g. `OPEN → RESOLVED` directly) is allowed; moving backward ' +
          '(`RESOLVED → OPEN`) returns `422 UNPROCESSABLE_ENTITY`.',
        ...BEARER_SECURITY,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: 'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a' }],
        'x-frontend-notes': {
          cacheable: false,
          retryOnFailure: false,
          supportsOptimisticUpdates: true,
          notes: 'Optimistically patch the local item, but be ready to roll back on 422 (illegal transition) — show the catalog message, not a generic error.',
        },
        'x-codeSamples': buildCodeSamples({
          method: 'PUT',
          path: '/api/my-follow-ups/d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a',
          authenticated: true,
          body: { status: 'IN_PROGRESS', notes: 'Reached out to student; awaiting response.' },
        }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], example: 'IN_PROGRESS', description: 'Optional. See transition rules above.' },
                  notes: { type: 'string', nullable: true, maxLength: 2000, example: 'Reached out to student; awaiting response.', description: 'Optional. Appended, not replaced — server concatenates with a timestamp.' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Case updated.',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/FollowUpCase' } } } } },
          },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'UNPROCESSABLE_ENTITY', 'INTERNAL_ERROR']),
        },
      },
    },
    '/profile/me': {
      get: {
        operationId: 'getMyProfile',
        tags: [TAG.Profile.name],
        summary: 'Get my profile',
        description: 'Returns the authenticated teacher\u2019s own profile data.',
        ...BEARER_SECURITY,
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 300, retryOnFailure: true, notes: 'Good candidate for app-shell-level caching — fetch once on login, refetch on focus.' },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/profile/me', authenticated: true }),
        responses: {
          '200': {
            description: 'Profile data.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileResponse' } } },
          },
          ...commonErrorResponses(['UNAUTHORIZED', 'INTERNAL_ERROR']),
        },
      },
    },
  },
};