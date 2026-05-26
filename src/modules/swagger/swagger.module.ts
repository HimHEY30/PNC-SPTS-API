import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SwaggerController } from './swagger.controller';
import { SwaggerDocsService } from './swagger-docs.service';

@Module({
  imports: [ConfigModule],
  controllers: [SwaggerController],
  providers: [SwaggerDocsService],
  exports: [SwaggerDocsService],
})
export class SwaggerModule {}
