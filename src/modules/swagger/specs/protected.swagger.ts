import { SwaggerDocument } from '../swagger.types';

export const protectedSwaggerDocument: SwaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'PNC SPTS API',
    version: '1.0.0',
    description:
      'Protected API documentation. This Swagger UI shows only endpoints that require an authenticated session. Public authentication endpoints such as login, refresh, and register are intentionally excluded from this document.',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'Endpoints available after login' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Roles & Permissions', description: 'Roles and permissions management endpoints' },
    { name: 'System', description: 'Protected system endpoints' },
    { name: 'Students', description: 'Student management endpoints' },
    { name: 'Follow-Up', description: 'Follow-up cases endpoints' },
  ],
  paths: {
    '/auth/logout': {
      post: {
        summary: 'Logout current session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refresh_token: { type: 'string', example: 'your-refresh-token' },
                },
                required: ['refresh_token'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
        tags: ['Authentication'],
      },
    },
    '/auth/logout-all': {
      post: {
        summary: 'Logout all sessions',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
        tags: ['Authentication'],
      },
    },
   
    '/users': {
      get: {
        summary: 'List users',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
        tags: ['Users'],
      },
      post: {
        summary: 'Create user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  first_name: { type: 'string', example: 'John' },
                  last_name: { type: 'string', example: 'Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  phone: { type: 'string', example: '012345678' },
                  password: { type: 'string', example: 'TempPassword123!' },
                  role: { type: 'string', example: 'TUTOR' },
                },
                required: ['first_name', 'last_name', 'email', 'password', 'role'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '409': { description: 'Conflict' },
        },
        tags: ['Users'],
      },
    },
    '/users/profile': {
      get: {
        summary: 'Get authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
        tags: ['Users'],
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Users'],
      },
      patch: {
        summary: 'Update user profile fields',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  first_name: { type: 'string', example: 'John' },
                  last_name: { type: 'string', example: 'Doe' },
                  phone: { type: 'string', example: '012345678' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Users'],
      },
      delete: {
        summary: 'Soft delete user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Users'],
      },
    },
    '/users/{id}/role': {
      patch: {
        summary: 'Assign role',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', example: 'ACADEMIC_MANAGER' },
                },
                required: ['role'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Users'],
      },
    },
    '/users/{id}/status': {
      patch: {
        summary: 'Update user status',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ACTIVE' },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Users'],
      },
    },
    '/roles': {
      get: {
        summary: 'List all roles',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
        tags: ['Roles & Permissions'],
      },
      post: {
        summary: 'Create a custom role',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'CUSTOM_ROLE' },
                  description: { type: 'string', example: 'Custom role description' },
                  permissions: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user.read', 'student.read'],
                  },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '409': { description: 'Conflict' },
        },
        tags: ['Roles & Permissions'],
      },
    },
    '/roles/{id}': {
      get: {
        summary: 'Get role by id or name',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Roles & Permissions'],
      },
      patch: {
        summary: 'Update role',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  description: { type: 'string', example: 'Updated description' },
                  permissions: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user.read'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Roles & Permissions'],
      },
      delete: {
        summary: 'Delete role',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'OK' },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Roles & Permissions'],
      },
    },
    '/roles/{id}/permissions': {
      post: {
        summary: 'Assign permissions to role',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  permissions: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user.read', 'user.create'],
                  },
                },
                required: ['permissions'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not Found' },
        },
        tags: ['Roles & Permissions'],
      },
    },
    '/permissions': {
      get: {
        summary: 'List all permissions',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
        tags: ['Roles & Permissions'],
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
        tags: ['System'],
      },
    },
    '/students': {
      get: {
        summary: 'Get paginated list of students',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        tags: ['Students'],
      },
      post: {
        summary: 'Create student',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } },
        tags: ['Students'],
      },
    },
    '/students/{id}': {
      get: {
        summary: 'Get student by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        tags: ['Students'],
      },
      patch: {
        summary: 'Update student',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        tags: ['Students'],
      },
      delete: {
        summary: 'Delete student',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        tags: ['Students'],
      },
    },
    '/follow-up/cases': {
      get: {
        summary: 'Get paginated list of follow-up cases',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        tags: ['Follow-Up'],
      },
      post: {
        summary: 'Create follow-up case',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } },
        tags: ['Follow-Up'],
      },
    },
    '/follow-up/cases/{id}': {
      get: {
        summary: 'Get a single follow-up case by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        tags: ['Follow-Up'],
      },
      put: {
        summary: 'Update follow-up case',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        tags: ['Follow-Up'],
      },
      delete: {
        summary: 'Delete a follow-up case',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        tags: ['Follow-Up'],
      },
    },
  },
};
