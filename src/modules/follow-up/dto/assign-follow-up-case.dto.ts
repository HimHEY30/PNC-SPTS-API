import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class AssignFollowUpCaseDto {
  @ApiProperty({
    description: 'Auth user UUID, or Teacher profile UUID, for the assigned teacher/tutor',
  })
  @IsString()
  teacherId: string;
}
