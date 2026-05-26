import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as swaggerUi from 'swagger-ui-express';
import { Public } from '../../common/decorators/public.decorator';

/**
 * SwaggerController builds a minimal OpenAPI spec at runtime and serves both:
 *  - JSON spec at `/docs-json`
 *  - Swagger UI at `/docs`
 * The Nest application applies a global prefix (default `api`).
 * Therefore the paths inside the spec should NOT contain that prefix – Nest will
 * automatically prepend it to the route URLs.
 */
@Controller()
export class SwaggerController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * GET /docs-json – returns the raw OpenAPI document as JSON.
   */
  @Get('docs-json')
  @Public()
  getSpec(@Res() res: Response) {
    const doc = this.buildSpec();
    res.json(doc);
  }

  /**
   * GET /docs – serves the Swagger UI, which fetches the spec from `/docs-json`.
   */
  @Get('docs')
  @Public()
  docs(@Req() req: Request, @Res() res: Response) {
    const spec = this.buildSpec();
    const handler = swaggerUi.setup(spec);
    // Invoke the handler to render the UI.
    handler(req, res, () => {});
  }

  /**
   * GET /auth/reference – returns a spec that only contains authentication endpoints.
   */
  @Get('auth/reference')
  @Public()
  authReference(@Res() res: Response) {
    const apiPrefix = this.configService.get<string>('app.apiPrefix', 'api');
    const authSpec: any = {
      openapi: '3.0.0',
      info: { title: 'Auth API', version: '1.0.0' },
      tags: [{ name: 'Authentication', description: 'Authentication related endpoints' }],
      paths: {
        '/auth/register': {
          post: {
            summary: 'Register user',
            requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
            responses: { '201': { description: 'Created' } },
            tags: ['Authentication'],
          },
        },
        '/auth/login': {
          post: {
            summary: 'Login user',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      email: { type: 'string', example: 'admin@example.com' },
                      password: { type: 'string', example: 'Password123' },
                    },
                    required: ['email', 'password'],
                  },
                },
              },
            },
            responses: { '200': { description: 'OK' } },
            tags: ['Authentication'],
          },
        },
        '/auth/logout': {
          post: { summary: 'Logout', responses: { '200': { description: 'OK' } }, tags: ['Authentication'] },
        },
      },
    };
    authSpec.paths = Object.fromEntries(
      Object.entries(authSpec.paths).map(([path, pathItem]) => [`/${apiPrefix}${path}`, pathItem]),
    );
    res.json(authSpec);
  }

  /**
   * Helper that constructs the full OpenAPI document used by `/docs-json`.
   */
  private buildSpec() {
    const apiPrefix = this.configService.get<string>('app.apiPrefix', 'api');
    const doc: any = {
      openapi: '3.0.0',
      info: { title: 'PNC SPTS API', version: '1.0.0' },
      paths: {},
      tags: [],
    };

    // ---- Auth endpoints ----------------------------------------------------
    doc.paths['/auth/register'] = {
      post: {
        summary: 'Register user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '201': { description: 'Created' } },
        tags: ['Authentication'],
      },
    };
    doc.paths['/auth/login'] = {
      post: {
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@example.com' },
                  password: { type: 'string', example: 'Password123' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
        tags: ['Authentication'],
      },
    };
    doc.paths['/auth/logout'] = {
      post: { summary: 'Logout', responses: { '200': { description: 'OK' } }, tags: ['Authentication'] },
    };

    // ---- Data endpoints ----------------------------------------------------
    doc.paths['/user/profile'] = {
      get: {
        summary: 'Get user profile',
        responses: {
          '200': { description: 'User profile returned' },
          '401': { description: 'Unauthorized' },
        },
        tags: ['Data'],
      },
    };

    // ---- Tag definitions ---------------------------------------------------
    doc.tags.push({ name: 'Authentication', description: 'Authentication related endpoints' });
    doc.tags.push({ name: 'Data', description: 'Application data endpoints' });

    doc.paths = Object.fromEntries(
      Object.entries(doc.paths).map(([path, pathItem]) => [`/${apiPrefix}${path}`, pathItem]),
    );

    return doc;
  }
}
