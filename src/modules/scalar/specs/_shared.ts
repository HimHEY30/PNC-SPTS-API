/**
 * _shared.ts
 * ──────────
 * Single source of truth for everything every role-spec file reuses:
 * security schemes, tags, common schemas, the business error catalog,
 * pagination/sorting/filtering parameter definitions, and helpers for
 * building consistent response objects and multi-language code samples.
 *
 * Convention reference: this module follows the same envelope/error
 * shape implied by TransformInterceptor / HttpExceptionFilter in main.ts.
 *   Success: { success: true, data: <payload>, meta?: {...} }
 *   Error:   { success: false, error: { code, message, details? } }
 */

import { ScalarDocument } from '../scalar.types';

// ───────────────────────────────────────────────────────────────────────────
// Security
// ───────────────────────────────────────────────────────────────────────────

export const bearerSecurityScheme = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description:
      'Standard JWT access token issued by `POST /auth/login`. ' +
      'Send as `Authorization: Bearer <access_token>`. ' +
      'Access tokens expire after 15 minutes — use `POST /auth/refresh` ' +
      'with the refresh token to obtain a new pair without re-prompting the user.',
  },
} as const;

export const BEARER_SECURITY = { security: [{ bearerAuth: [] }] } as const;

// ───────────────────────────────────────────────────────────────────────────
// Tags — grouping shown in Scalar's sidebar
// ───────────────────────────────────────────────────────────────────────────

export const TAG = {
  Auth: {
    name: 'Authentication',
    description:
      'Login, token refresh, and logout. All endpoints in this group are ' +
      'public except logout, which requires a valid access token to revoke.',
  },
  Users: {
    name: 'Users',
    description: 'Directory of all platform identities, regardless of role.',
  },
  Teachers: {
    name: 'Teachers',
    description: 'Faculty roster management and individual teacher records.',
  },
  Students: {
    name: 'Students',
    description: 'Student roster, enrollment, and individual student records.',
  },
  FollowUps: {
    name: 'Follow-Up Cases',
    description: 'Intervention / escalation tickets raised against a student.',
  },
  Dashboard: {
    name: 'Dashboard',
    description: 'Aggregate metrics and counters for overview screens.',
  },
  Profile: {
    name: 'Profile',
    description: "The authenticated caller's own profile.",
  },
  Classes: {
    name: 'Classes',
    description: 'Academic classes and sections.',
  },
} as const;

// ───────────────────────────────────────────────────────────────────────────
// Servers
// ───────────────────────────────────────────────────────────────────────────

export const devServer = {
  url: 'http://localhost:3000',
  description: 'Local development',
};

export const stagingServer = {
  url: 'https://staging-api.platform.example.com',
  description: 'Staging',
};

export const productionServer = {
  url: 'https://api.platform.example.com',
  description: 'Production',
};

export const ALL_SERVERS = [devServer, stagingServer, productionServer];

// ───────────────────────────────────────────────────────────────────────────
// Business error catalog
// ───────────────────────────────────────────────────────────────────────────
// One stable code per failure mode. Re-used via $ref so every endpoint that
// can produce a given error documents it identically. Frontend teams can
// switch on `error.code`, not on the HTTP status or the message string.

export interface BusinessErrorDef {
  code: string;
  httpStatus: number;
  message: string;
  cause: string;
  frontendHandling: string;
  retry: 'no' | 'yes-immediate' | 'yes-with-backoff' | 'after-user-action';
}

export const ERROR_CATALOG: Record<string, BusinessErrorDef> = {
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    httpStatus: 400,
    message: 'One or more fields failed validation.',
    cause: 'Request body or query params did not satisfy the DTO validation rules (see field-level `details`).',
    frontendHandling: 'Map `error.details[].field` to form fields and show inline errors. Do not retry until the user edits input.',
    retry: 'no',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    httpStatus: 401,
    message: 'Missing, expired, or invalid access token.',
    cause: 'No Authorization header, malformed JWT, or token past its 15-minute expiry.',
    frontendHandling: 'Attempt a silent refresh via `POST /auth/refresh`. If that also fails, clear local session and redirect to login.',
    retry: 'after-user-action',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    httpStatus: 403,
    message: 'Authenticated, but the current role lacks permission for this action.',
    cause: 'Role-based guard rejected the request (e.g. a Teacher calling an Admin-only route).',
    frontendHandling: 'This is a logic error if the UI surfaced the action at all — hide/disable the control for this role rather than relying on the 403.',
    retry: 'no',
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    httpStatus: 404,
    message: 'The requested resource does not exist or is not visible to you.',
    cause: 'Bad id in the path, or the record exists but is scoped to a different user/role.',
    frontendHandling: 'Show a not-found state; do not auto-retry. Consider invalidating any cached list that referenced this id.',
    retry: 'no',
  },
  CONFLICT: {
    code: 'CONFLICT',
    httpStatus: 409,
    message: 'The request conflicts with the current state of the resource.',
    cause: 'E.g. duplicate email on user creation, or a status transition that is not allowed from the current state.',
    frontendHandling: 'Surface the conflict explicitly (e.g. "email already in use"); let the user change input and resubmit.',
    retry: 'no',
  },
  UNPROCESSABLE_ENTITY: {
    code: 'UNPROCESSABLE_ENTITY',
    httpStatus: 422,
    message: 'Request was well-formed but semantically invalid.',
    cause: 'Passed schema validation but violates a business rule, e.g. resolving a follow-up case with no notes.',
    frontendHandling: 'Same handling as VALIDATION_FAILED — show inline messaging from `error.details` if present.',
    retry: 'no',
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    httpStatus: 429,
    message: 'Too many requests in a short period.',
    cause: 'Caller exceeded the rate limit for this endpoint (see Rate Limits section / `Retry-After` header).',
    frontendHandling: 'Read the `Retry-After` header (seconds) and back off before retrying automatically.',
    retry: 'yes-with-backoff',
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    httpStatus: 500,
    message: 'An unexpected error occurred on the server.',
    cause: 'Unhandled exception. Treat as a bug — should be reported, not designed around.',
    frontendHandling: 'Show a generic "something went wrong" state with a retry button. Log to your error tracker with the request id.',
    retry: 'yes-immediate',
  },
};

/** Builds the OpenAPI `responses` fragment for a single error code. */
function buildErrorResponse(def: BusinessErrorDef) {
  return {
    description: `${def.message} (\`${def.code}\`)`,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: {
            code: def.code,
            message: def.message,
            details: def.code === 'VALIDATION_FAILED' || def.code === 'UNPROCESSABLE_ENTITY'
              ? [{ field: 'email', issue: 'must be a valid email address' }]
              : null,
          },
        },
      },
    },
  };
}

/**
 * Standard error responses every authenticated endpoint should document.
 * Pass a custom subset for public endpoints (e.g. omit 401/403) via the
 * `codes` argument.
 */
export function commonErrorResponses(
  codes: Array<keyof typeof ERROR_CATALOG> = [
    'VALIDATION_FAILED',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'INTERNAL_ERROR',
  ],
) {
  const out: Record<string, unknown> = {};
  for (const key of codes) {
    out[String(ERROR_CATALOG[key].httpStatus)] = buildErrorResponse(ERROR_CATALOG[key]);
  }
  return out;
}

// Back-compat alias used by older spec files.
export const commonResponses = commonErrorResponses();

// ───────────────────────────────────────────────────────────────────────────
// Common schemas
// ───────────────────────────────────────────────────────────────────────────

export const commonSchemas = {
  ErrorDetail: {
    type: 'object',
    properties: {
      field: { type: 'string', example: 'email' },
      issue: { type: 'string', example: 'must be a valid email address' },
    },
  },
  ErrorResponse: {
    type: 'object',
    required: ['success', 'error'],
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'VALIDATION_FAILED', description: 'Stable machine-readable code. Switch on this, not on the HTTP status or message text.' },
          message: { type: 'string', example: 'One or more fields failed validation.' },
          details: {
            type: 'array',
            nullable: true,
            items: { $ref: '#/components/schemas/ErrorDetail' },
            description: 'Present for validation-style errors. Null/omitted otherwise.',
          },
        },
      },
    },
  },
  PaginationMeta: {
    type: 'object',
    required: ['total', 'page', 'limit', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
    properties: {
      total: { type: 'integer', example: 120, description: 'Total number of records matching the query, across all pages.' },
      page: { type: 'integer', example: 1, description: 'Current 1-indexed page number.' },
      limit: { type: 'integer', example: 20, description: 'Number of records per page.' },
      totalPages: { type: 'integer', example: 6 },
      hasNextPage: { type: 'boolean', example: true },
      hasPreviousPage: { type: 'boolean', example: false },
    },
  },
  LoginResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        required: ['accessToken', 'refreshToken', 'accessTokenExpiresIn', 'user'],
        properties: {
          accessToken: { type: 'string', description: 'JWT, expires in 15 minutes.', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.4f...' },
          refreshToken: { type: 'string', description: 'Opaque/JWT refresh token, expires in 7 days. Store in httpOnly cookie or secure storage — never localStorage on web if avoidable.', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.9a...' },
          accessTokenExpiresIn: { type: 'integer', example: 900, description: 'Seconds until accessToken expires.' },
          user: {
            type: 'object',
            required: ['id', 'email', 'role'],
            properties: {
              id: { type: 'string', format: 'uuid', example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6' },
              email: { type: 'string', format: 'email', example: 'operator@platform.example.com' },
              role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'STUDENT'], example: 'TEACHER' },
            },
          },
        },
      },
    },
  },
  RefreshResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        required: ['accessToken', 'accessTokenExpiresIn'],
        properties: {
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.new...' },
          accessTokenExpiresIn: { type: 'integer', example: 900 },
        },
      },
    },
  },
  ProfileResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        required: ['id', 'email', 'firstName', 'lastName'],
        properties: {
          id: { type: 'string', format: 'uuid', example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6' },
          email: { type: 'string', format: 'email', example: 'jane.miller@platform.example.com' },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Miller' },
          phoneNumber: { type: 'string', nullable: true, example: '+15550199283' },
          avatarUrl: { type: 'string', nullable: true, format: 'uri', example: 'https://cdn.platform.example.com/assets/avatar.png' },
        },
      },
    },
  },
  UserEntity: {
    type: 'object',
    required: ['id', 'email', 'role', 'isActive', 'createdAt'],
    properties: {
      id: { type: 'string', format: 'uuid', example: 'a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
      email: { type: 'string', format: 'email', example: 'account@platform.example.com' },
      role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'STUDENT'], example: 'TEACHER' },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time', example: '2026-01-15T08:00:00Z' },
    },
  },
  TeacherEntity: {
    type: 'object',
    required: ['id', 'userId', 'department', 'qualification'],
    properties: {
      id: { type: 'string', format: 'uuid', example: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e' },
      userId: { type: 'string', format: 'uuid', example: 'a6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
      department: { type: 'string', example: 'Department of Computer Science' },
      qualification: { type: 'string', example: 'Ph.D. in Artificial Intelligence' },
    },
  },
  StudentEntity: {
    type: 'object',
    required: ['id', 'userId', 'enrollmentNumber', 'status'],
    properties: {
      id: { type: 'string', format: 'uuid', example: 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f' },
      userId: { type: 'string', format: 'uuid', example: 'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b' },
      enrollmentNumber: { type: 'string', example: 'STU-2026-8891' },
      status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'GRADUATED'], example: 'ACTIVE' },
    },
  },
};

export const followUpCaseSchemas = {
  FollowUpCase: {
    type: 'object',
    required: ['id', 'title', 'status', 'priority', 'studentId', 'createdAt'],
    properties: {
      id: { type: 'string', format: 'uuid', example: 'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a' },
      title: { type: 'string', example: 'Declining Academic Engagement Rate' },
      description: { type: 'string', nullable: true, example: 'Student missed successive milestones in core modules.' },
      status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], example: 'IN_PROGRESS' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'HIGH' },
      studentId: { type: 'string', format: 'uuid', example: 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f' },
      assignedToId: { type: 'string', format: 'uuid', nullable: true, example: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e' },
      createdAt: { type: 'string', format: 'date-time', example: '2026-06-20T10:15:30Z' },
      updatedAt: { type: 'string', format: 'date-time', example: '2026-06-25T14:30:00Z' },
    },
  },
};

// ───────────────────────────────────────────────────────────────────────────
// Pagination / sorting / filtering — reusable parameter sets
// ───────────────────────────────────────────────────────────────────────────

export const paginationParams = [
  { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 }, description: '1-indexed page number.' },
  { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, description: 'Records per page. Max 100.' },
];

export function sortingParams(allowedFields: string[]) {
  return [
    { name: 'sortBy', in: 'query', required: false, schema: { type: 'string', enum: allowedFields, default: allowedFields[0] }, description: 'Field to sort by.' },
    { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }, description: 'Sort direction.' },
  ];
}

// ───────────────────────────────────────────────────────────────────────────
// x-codeSamples — multi-language request examples rendered natively by Scalar
// ───────────────────────────────────────────────────────────────────────────
// Scalar reads the `x-codeSamples` vendor extension on an operation and
// renders a language switcher next to "Try it". Each sample is plain source
// text — Scalar does not execute or template it.

export interface CodeSampleInputs {
  method: string;
  path: string; // already includes the API prefix, e.g. /api/teachers
  authenticated: boolean;
  body?: Record<string, unknown>;
}

export function buildCodeSamples({ method, path, authenticated, body }: CodeSampleInputs) {
  const m = method.toUpperCase();
  const bodyJson = body ? JSON.stringify(body, null, 2) : undefined;
  const authHeaderCurl = authenticated ? ` \\\n  -H "Authorization: Bearer $ACCESS_TOKEN"` : '';
  const authHeaderJs = authenticated ? `\n    Authorization: \`Bearer \${accessToken}\`,` : '';

  const curl = [
    `curl -X ${m} "https://api.platform.example.com${path}"${authHeaderCurl}`,
    ` \\\n  -H "Content-Type: application/json"`,
    bodyJson ? ` \\\n  -d '${bodyJson.replace(/\n/g, '')}'` : '',
  ].join('');

  const js = `const response = await fetch("https://api.platform.example.com${path}", {
  method: "${m}",
  headers: {
    "Content-Type": "application/json",${authHeaderJs}
  },${bodyJson ? `\n  body: JSON.stringify(${bodyJson.split('\n').map((l, i) => (i === 0 ? l : '  ' + l)).join('\n')}),` : ''}
});
const result = await response.json();`;

  const python = `import requests

response = requests.${m.toLowerCase()}(
    "https://api.platform.example.com${path}",
    headers={${authenticated ? '\n        "Authorization": f"Bearer {access_token}",' : ''}
        "Content-Type": "application/json",
    },${bodyJson ? `\n    json=${bodyJson.replace(/"/g, "'")},` : ''}
)
result = response.json()`;

  const kotlin = `val request = Request.Builder()
    .url("https://api.platform.example.com${path}")
    .method("${m}", ${bodyJson ? `"${bodyJson.replace(/\n/g, ' ').replace(/"/g, '\\"')}".toRequestBody(jsonMediaType)` : 'null'})${authenticated ? '\n    .addHeader("Authorization", "Bearer $accessToken")' : ''}
    .build()
val response = client.newCall(request).execute()`;

  const swift = `var request = URLRequest(url: URL(string: "https://api.platform.example.com${path}")!)
request.httpMethod = "${m}"
${authenticated ? 'request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization")\n' : ''}request.setValue("application/json", forHTTPHeaderField: "Content-Type")
${bodyJson ? `request.httpBody = try JSONSerialization.data(withJSONObject: ${bodyJson})\n` : ''}let (data, response) = try await URLSession.shared.data(for: request)`;

  return [
    { lang: 'curl', label: 'cURL', source: curl },
    { lang: 'javascript', label: 'JavaScript (fetch)', source: js },
    { lang: 'python', label: 'Python', source: python },
    { lang: 'kotlin', label: 'Kotlin (OkHttp)', source: kotlin },
    { lang: 'swift', label: 'Swift (URLSession)', source: swift },
  ];
}

// ───────────────────────────────────────────────────────────────────────────
// Document-level enhancement hook
// ───────────────────────────────────────────────────────────────────────────

export function enhanceScalarDocument(doc: ScalarDocument): ScalarDocument {
  return doc;
}