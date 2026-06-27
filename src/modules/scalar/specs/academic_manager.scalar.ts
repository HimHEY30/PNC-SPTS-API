/**
 * academic_manager.scalar.ts
 * ──────────────────────────
 * OpenAPI specification for the Academic Manager role.
 *
 * Scope: teacher and student roster CRUD, plus read access to the global
 * follow-up case board (escalation visibility across all teachers).
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

export const academicManagerSwaggerDocument: ScalarDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Academic Manager API Reference',
    version: '1.0.0',
    description: `
API for managing the teacher and student rosters and reviewing the global
follow-up case pipeline across all classes — not just one teacher's own.

**Scope of this token:** Academic Managers can create/read/delete Teacher
and Student records, and read (but not directly create) follow-up cases
raised by any teacher.

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
  tags: [TAG.Auth, TAG.Teachers, TAG.Students, TAG.FollowUps],
  components: {
    securitySchemes: { ...bearerSecurityScheme },
    schemas: { ...commonSchemas, ...followUpCaseSchemas },
  },
  paths: {
    '/auth/login': {
      post: {
        operationId: 'academicManagerLogin',
        tags: [TAG.Auth.name],
        summary: 'Log in',
        description: 'Public endpoint. Exchanges email + password for an access/refresh token pair scoped to the Academic Manager role.',
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Disable submit while in flight.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/auth/login', authenticated: false, body: { email: 'manager.ops@platform.com', password: 'P@ssword123' } }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'manager.ops@platform.com' },
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
    '/teachers': {
      get: {
        operationId: 'listTeachers',
        tags: [TAG.Teachers.name],
        summary: 'List teachers',
        description: 'Paginated faculty roster. Permissions: Academic Manager, Admin, Super Admin.',
        ...BEARER_SECURITY,
        parameters: [...paginationParams, ...sortingParams(['department', 'createdAt']), { name: 'department', in: 'query', required: false, schema: { type: 'string' }, description: 'Filter by exact department name.' }],
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 60, retryOnFailure: true, supportsInfiniteScrolling: true },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/teachers?page=1&limit=20', authenticated: true }),
        responses: {
          '200': {
            description: 'Paginated teacher list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success', 'data', 'meta'],
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/TeacherEntity' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          ...commonErrorResponses(['UNAUTHORIZED', 'FORBIDDEN', 'INTERNAL_ERROR']),
        },
      },
      post: {
        operationId: 'createTeacher',
        tags: [TAG.Teachers.name],
        summary: 'Onboard a teacher',
        description: 'Attaches a Teacher profile (department, qualification) to an existing user account. `userId` must reference a user with role `TEACHER` that does not already have a teacher profile, or this returns `409 CONFLICT`.',
        ...BEARER_SECURITY,
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Typically called right after `POST /users` with role TEACHER, as a two-step onboarding flow.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/teachers', authenticated: true, body: { userId: 'a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', department: 'Department of Computer Science', qualification: 'Ph.D. in Artificial Intelligence' } }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'department'],
                properties: {
                  userId: { type: 'string', format: 'uuid', example: 'a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'Required. Must be an existing user with role TEACHER.' },
                  department: { type: 'string', minLength: 2, maxLength: 120, example: 'Department of Computer Science', description: 'Required.' },
                  qualification: { type: 'string', nullable: true, maxLength: 200, example: 'Ph.D. in Artificial Intelligence', description: 'Optional.' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Teacher profile created.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/TeacherEntity' } } } } } },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'INTERNAL_ERROR']),
        },
      },
    },
    '/teachers/{id}': {
      get: {
        operationId: 'getTeacherById',
        tags: [TAG.Teachers.name],
        summary: 'Get a teacher by id',
        ...BEARER_SECURITY,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e' }],
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 60, retryOnFailure: true },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/teachers/b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', authenticated: true }),
        responses: {
          '200': { description: 'Teacher found.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/TeacherEntity' } } } } } },
          ...commonErrorResponses(['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_ERROR']),
        },
      },
      delete: {
        operationId: 'deleteTeacher',
        tags: [TAG.Teachers.name],
        summary: 'Remove a teacher profile',
        description: 'Deletes the Teacher profile record. Does **not** delete the underlying user account — call `PUT /users/{id}` with `isActive: false` separately if you also want to deactivate login. Returns `204 No Content` on success (no response body).',
        ...BEARER_SECURITY,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e' }],
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'Show a confirmation dialog — this is not soft-deletable through this endpoint. Removing the row also orphans any classes the teacher was assigned to; the UI should warn about reassignment.' },
        'x-codeSamples': buildCodeSamples({ method: 'DELETE', path: '/api/teachers/b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', authenticated: true }),
        responses: {
          '204': { description: 'Teacher profile deleted. No response body.' },
          ...commonErrorResponses(['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_ERROR']),
        },
      },
    },
    '/students': {
      get: {
        operationId: 'listStudents',
        tags: [TAG.Students.name],
        summary: 'List students',
        description: 'Paginated student roster across all classes.',
        ...BEARER_SECURITY,
        parameters: [
          ...paginationParams,
          ...sortingParams(['enrollmentNumber', 'createdAt']),
          { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'GRADUATED'] }, description: 'Filter by enrollment status.' },
        ],
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 60, retryOnFailure: true, supportsInfiniteScrolling: true },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/students?page=1&limit=20', authenticated: true }),
        responses: {
          '200': {
            description: 'Paginated student list.',
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
      post: {
        operationId: 'createStudent',
        tags: [TAG.Students.name],
        summary: 'Enroll a student',
        description: 'Attaches a Student profile to an existing user account with role `STUDENT`. `enrollmentNumber` must be unique across the platform.',
        ...BEARER_SECURITY,
        'x-frontend-notes': { cacheable: false, retryOnFailure: false, notes: 'On 409, surface "enrollment number already in use" inline.' },
        'x-codeSamples': buildCodeSamples({ method: 'POST', path: '/api/students', authenticated: true, body: { userId: 'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', enrollmentNumber: 'STU-2026-8891' } }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'enrollmentNumber'],
                properties: {
                  userId: { type: 'string', format: 'uuid', example: 'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', description: 'Required. Must reference an existing user with role STUDENT.' },
                  enrollmentNumber: { type: 'string', pattern: '^STU-\\d{4}-\\d{4,}$', example: 'STU-2026-8891', description: 'Required. Format: STU-YYYY-NNNN. Must be unique.' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Student enrolled, status defaults to ACTIVE.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/StudentEntity' } } } } } },
          ...commonErrorResponses(['VALIDATION_FAILED', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'INTERNAL_ERROR']),
        },
      },
    },
    '/follow-up/cases': {
      get: {
        operationId: 'listAllFollowUpCases',
        tags: [TAG.FollowUps.name],
        summary: 'List all follow-up cases',
        description: 'Global view of every intervention case across all teachers and students — used for the escalation board. Permissions: Academic Manager, Admin, Super Admin only; Teachers only see their own subset via `/my-follow-ups`.',
        ...BEARER_SECURITY,
        parameters: [
          ...paginationParams,
          ...sortingParams(['createdAt', 'priority']),
          { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'] } },
          { name: 'priority', in: 'query', required: false, schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
        ],
        'x-frontend-notes': { cacheable: true, cacheTtlSeconds: 15, retryOnFailure: true, notes: 'Shorter cache TTL than other lists — this powers a live triage board where staleness matters more.' },
        'x-codeSamples': buildCodeSamples({ method: 'GET', path: '/api/follow-up/cases?page=1&limit=20&priority=CRITICAL', authenticated: true }),
        responses: {
          '200': {
            description: 'Paginated global case list.',
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
    },
  },
};