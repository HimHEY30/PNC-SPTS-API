import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiPropertyOptional({ enum: StudentStatus, description: 'The status of the student' })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
