import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectFollowUpCaseDto {
  @ApiProperty({ example: 'Teacher unavailable' })
  @IsString()
  @MinLength(1)
  reason: string;
}
