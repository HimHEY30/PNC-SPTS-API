import { Controller, Get, Res } from '@nestjs/common';
import { join } from 'path';
import { Response } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';

@Controller()
export class SwaggerController {
  @Get('docs')
  async docs(@Res() res: Response) {
    // Serve Swagger UI with openapi spec from file if present, otherwise a minimal spec
    const specPath = join(process.cwd(), 'openapi.json');
    let doc = { openapi: '3.0.0', info: { title: 'API', version: '1.0.0' }, paths: {} };
    if (fs.existsSync(specPath)) {
      doc = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    } else {
      // Minimal doc describing auth endpoints
      doc.paths['/auth/register'] = {
        post: {
          summary: 'Register user',
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Created' } },
        },
      };
      doc.paths['/auth/login'] = {
        post: {
          summary: 'Login user',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'admin@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: { '200': { description: 'OK' } },
        },
      };
      doc.paths['/auth/logout'] = {
        post: { summary: 'Logout', responses: { '200': { description: 'OK' } } },
      };
    }

    // Use swagger-ui-express to serve
    const html = swaggerUi.generateHTML(doc);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('auth/reference')
  async reference(@Res() res: Response) {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Auth Reference', version: '1.0.0' },
      paths: {
        '/auth/register': {
          post: {
            summary: 'Register user',
            requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } } },
            responses: { '201': { description: 'Created' } },
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
                      password: { type: 'string', example: 'password123' },
                    },
                    required: ['email', 'password'],
                  },
                },
              },
            },
            responses: { '200': { description: 'OK' } },
          },
        },
        '/auth/logout': { post: { summary: 'Logout', responses: { '200': { description: 'OK' } } } },
      },
    };
    res.json(spec);
  }
}
