import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CompleteFollowUpCaseDto {
  @ApiProperty({ example: 'Follow-up completed successfully.' })
  @IsString()
  @MinLength(1)
  summary: string;
}
