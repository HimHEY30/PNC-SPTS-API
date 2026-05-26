import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SwaggerDocsService } from './swagger-docs.service';

@Controller()
export class SwaggerController {
  constructor(private readonly swaggerDocsService: SwaggerDocsService) {}

  @Get('docs-json')
  @Public()
  getProtectedSpec(@Res() res: Response) {
    res.json(this.swaggerDocsService.getProtectedDocument());
  }

  @Get('auth/reference-json')
  @Public()
  getPublicSpec(@Res() res: Response) {
    res.json(this.swaggerDocsService.getPublicAuthDocument());
  }
}
