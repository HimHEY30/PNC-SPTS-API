import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { FollowUpStatus, PriorityLevel } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFollowUpCaseDto {
  @ApiProperty({ description: 'The UUID of the student' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'The UUID of the teacher who opened the case' })
  @IsUUID()
  openedByTeacherId: string;

  @ApiProperty({ description: 'The UUID of the academic term' })
  @IsUUID()
  termId: string;

  @ApiProperty({ example: 'Poor attendance', description: 'Title of the follow-up case' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description of the issue' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PriorityLevel, description: 'Priority level' })
  @IsEnum(PriorityLevel)
  priority: PriorityLevel;

  @ApiProperty({ enum: FollowUpStatus, description: 'Status of the follow-up case' })
  @IsEnum(FollowUpStatus)
  status: FollowUpStatus;
}
