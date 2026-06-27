/**
 * admin.scalar.ts
 * ───────────────
 * OpenAPI specification for the Admin role.
 *
 * Scope: full user directory management (excluding role escalation to
 * SUPER_ADMIN, which is reserved for that role) and dashboard metrics.
 */

import { ScalarDocument } from '../scalar.types';
import {
  bearerSecurityScheme,
  BEARER_SECURITY,
  commonSchemas,
  commonErrorResponses,
  paginationParams,
  sortingParams,
  buildCodeSamples,
  TAG,
  ALL_SERVERS,
} from './_shared';

export const adminSwaggerDocument: ScalarDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Admin API Reference',
    version: '1.0.0',
    description: `
Administrative API for managing the full user directory and viewing
platform-wide dashboard metrics.

**Scope of this token:** Admins can create, read, and deactivate any user
account, including Teachers, Students, and Academic Managers. Admins
**cannot** assign or revoke the \`SUPER_ADMIN\` role — attempting to set
\`role: SUPER_ADMIN\` on \`PUT /users/{id}\` returns \`403 FORBIDDEN\`.

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
  tags: [TAG.Auth, TAG.Users, TAG.Dashboard],
  components: {
    securitySchemes: { ...bearerSecurityScheme },
    schemas: { ...commonSchemas },
  },
  paths: {
    '/auth/login': {
      post: {
        operationId: 'adminLogin',
        tags: [TAG.Auth.name],
        summary: 'Log in',
        description: 'Public endpoint. Exchanges email + password for an access/refresh token pair scoped to the Admin role.',
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Disable submit while in flight; store accessToken in memory, refreshToken in secure storage.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/auth/login', authenticated: false, body: { email: 'admin.ops@platform.com', password: 'P@ssword123' } }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin.ops@platform.com' },
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
    '/auth/refresh': {
      post: {
        operationId: 'adminRefreshToken',
        tags: [TAG.Auth.name],
        summary: 'Refresh access token',
        description: 'Exchanges a valid refresh token for a new access token.',
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'On 401 here, the refresh token expired — force re-login, do not loop.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/auth/refresh', authenticated: false, body: { refreshToken: '<refresh_token>' } }),
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' } } } } },
        },
        responses: {
          '200': { description: 'New access token issued.', content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshResponse' } } } },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'INTERNAL_ERROR']),
        },
      },
    },
    '/auth/logout': {
      post: {
        operationId: 'adminLogout',
        tags: [TAG.Auth.name],
        summary: 'Log out',
        description: 'Revokes the current refresh token server-side.',
        ...BEARER_SECURITY,
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Clear local tokens regardless of response.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/auth/logout', authenticated: true }),
        responses: {
          '200': { description: 'Session revoked.' },
          ...commonErrorResponses(['UNAUTHORIZED', 'INTERNAL_ERROR']),
        },
      },
    },
    '/users': {
      get: {
        operationId: 'listUsers',
        tags: [TAG.Users.name],
        summary: 'List users',
        description: 'Paginated directory of all user accounts across every role. Permissions: Admin, Super Admin, Academic Manager (read-only for the latter).',
        ...BEARER_SECURITY,
        parameters: [
          ...paginationParams,
          ...sortingParams(['createdAt', 'email', 'role']),
          { name: 'role', in: 'query', required: false, schema: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'STUDENT'] }, description: 'Filter by role.' },
          { name: 'isActive', in: 'query', required: false, schema: { type: 'boolean' }, description: 'Filter by active status.' },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: 'Free-text match against email.' },
        ],
        'x-frontend-notes': {
          cacheable: true,
          cacheTtlSeconds: 30,
          retryOnFailure: true,
          supportsInfiniteScrolling: true,
          debounceRecommendationMs: 300,
          paginationStrategy: 'Prefer page-based pagination here over infinite scroll for an admin table — users expect to jump to a specific page.',
        },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/users?page=1&limit=20', authenticated: true }),
        responses: {
          '200': {
            description: 'Paginated user list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success', 'data', 'meta'],
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/UserEntity' } },
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
        operationId: 'createUser',
        tags: [TAG.Users.name],
        summary: 'Create a user',
        description: 'Creates a new account. `role` defaults to `STUDENT` if omitted. Cannot create a `SUPER_ADMIN` account — returns `403 FORBIDDEN`.',
        ...BEARER_SECURITY,
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Disable submit while in flight. On 409 (duplicate email), surface inline on the email field.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/users', authenticated: true, body: { email: 'new.user@platform.com', password: 'P@ssword123', role: 'TEACHER' } }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'new.user@platform.com', description: 'Required. Must be unique.' },
                  password: { type: 'string', format: 'password', minLength: 8, example: 'P@ssword123', description: 'Required. Min 8 chars, must include at least one number.' },
                  role: { type: 'string', enum: ['ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'STUDENT'], default: 'STUDENT', example: 'TEACHER', description: 'Optional, defaults to STUDENT. SUPER_ADMIN not assignable here.' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/UserEntity' } } } } } },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'CONFLICT', 'INTERNAL_ERROR']),
        },
      },
    },
    '/users/{id}': {
      get: {
        operationId: 'getUserById',
        tags: [TAG.Users.name],
        summary: 'Get a user by id',
        description: 'Permissions: Admin, Super Admin.',
        ...BEARER_SECURITY,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: 'a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }],
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 30, retryOnFailure: true },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/users/a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', authenticated: true }),
        responses: {
          '200': { description: 'User found.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/UserEntity' } } } } } },
          ...commonErrorResponses(['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_ERROR']),
        },
      },
      put: {
        operationId: 'updateUser',
        tags: [TAG.Users.name],
        summary: 'Update a user',
        description: 'Currently supports toggling `isActive` (deactivation). Deactivating a user immediately revokes all of their active refresh tokens.',
        ...BEARER_SECURITY,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: 'a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }],
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, supportsOptimisticUpdates: true, notes: 'Show a confirmation dialog before deactivating — this immediately logs the user out everywhere.' },
        'x-codeSamples': buildCodeSamples({ method: 'PUT', path: '/api/users/a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', authenticated: true, body: { isActive: false } }),
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { isActive: { type: 'boolean', example: false, description: 'Optional. Set false to deactivate; revokes all sessions immediately.' } } } } },
        },
        responses: {
          '200': { description: 'User updated.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/UserEntity' } } } } } },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_ERROR']),
        },
      },
    },
    '/dashboard': {
      get: {
        operationId: 'getDashboardMetrics',
        tags: [TAG.Dashboard.name],
        summary: 'Get dashboard metrics',
        description: 'Aggregate counters for the admin overview screen.',
        ...BEARER_SECURITY,
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 60, retryOnFailure: true, notes: 'Good candidate for a 60s polling interval rather than realtime; not a websocket-backed endpoint.' },
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
                    data: {
                      type: 'object',
                      properties: {
                        activeUsers: { type: 'integer', example: 450 },
                        activeCases: { type: 'integer', example: 12 },
                      },
                    },
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