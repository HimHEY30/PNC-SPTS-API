import { SwaggerDocument } from '../swagger.types';

export const publicAuthSwaggerDocument: SwaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Public Auth API',
    version: '1.0.0',
    description:
      'Public authentication documentation. This Swagger UI shows only endpoints that can be accessed without a bearer token.',
  },
  tags: [
    { name: 'Public Authentication', description: 'Endpoints accessible without bearer token' },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Registration disabled',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'newuser@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          '403': { description: 'Public registration is disabled' },
        },
        tags: ['Public Authentication'],
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'superadmin@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
        tags: ['Public Authentication'],
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
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
          '422': { description: 'Validation Error' },
        },
        tags: ['Public Authentication'],
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Request password reset link',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                },
                required: ['email'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '422': { description: 'Validation Error' },
        },
        tags: ['Public Authentication'],
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', example: 'reset-token-here' },
                  newPassword: { type: 'string', example: 'NewPassword123!' },
                },
                required: ['token', 'newPassword'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Invalid or expired token' },
          '422': { description: 'Validation Error' },
        },
        tags: ['Public Authentication'],
      },
    },
  },
};
