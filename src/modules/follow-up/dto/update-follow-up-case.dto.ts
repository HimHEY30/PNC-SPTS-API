import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { FollowUpStatus, PriorityLevel } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFollowUpCaseDto {
  @ApiPropertyOptional({ description: 'The UUID of the student' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'The UUID of the teacher who opened the case' })
  @IsOptional()
  @IsUUID()
  openedByTeacherId?: string;

  @ApiPropertyOptional({ description: 'The UUID of the academic term' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ example: 'Poor attendance', description: 'Title of the follow-up case' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed description of the issue' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PriorityLevel, description: 'Priority level' })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @ApiPropertyOptional({ enum: FollowUpStatus, description: 'Status of the follow-up case' })
  @IsOptional()
  @IsEnum(FollowUpStatus)
  status?: FollowUpStatus;
}
