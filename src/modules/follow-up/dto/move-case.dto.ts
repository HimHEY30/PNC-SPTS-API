import { IsEnum } from 'class-validator';
import { FollowUpStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class MoveCaseDto {
  @ApiProperty({ enum: FollowUpStatus, description: 'The new status of the follow-up case' })
  @IsEnum(FollowUpStatus)
  status: FollowUpStatus;
}
