import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttachmentDto {
  @ApiProperty({ description: 'The UUID of the follow-up report to attach the file to' })
  @IsString()
  reportId: string;
}
