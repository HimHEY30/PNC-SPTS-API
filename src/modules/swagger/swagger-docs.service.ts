import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { publicAuthSwaggerDocument } from './specs/public-auth.swagger';
import { protectedSwaggerDocument } from './specs/protected.swagger';
import { SwaggerDocument } from './swagger.types';

@Injectable()
export class SwaggerDocsService {
  constructor(private readonly configService: ConfigService) {}

  getProtectedDocument() {
    return this.withPrefix(protectedSwaggerDocument);
  }

  getPublicAuthDocument() {
    return this.withPrefix(publicAuthSwaggerDocument);
  }

  private withPrefix(doc: SwaggerDocument): SwaggerDocument {
    const apiPrefix = this.configService.get<string>('app.apiPrefix', 'api');

    return {
      ...doc,
      paths: Object.fromEntries(
        Object.entries(doc.paths).map(([path, pathItem]) => [`/${apiPrefix}${path}`, pathItem]),
      ),
    };
  }
}
