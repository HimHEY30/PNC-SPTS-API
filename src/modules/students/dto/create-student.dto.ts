import { IsString, IsEmail, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Gender } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'STU-001', description: 'The student code' })
  @IsString()
  studentCode: string;

  @ApiProperty({ example: 'Alice', description: 'The first name of the student' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'The last name of the student' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ enum: Gender, description: 'The gender of the student' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '2000-01-01', description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Phnom Penh', description: 'Place of birth' })
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @ApiPropertyOptional({ example: '+85512345678', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'alice@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Class ID to which the student belongs' })
  @IsOptional()
  @IsString()
  classId?: string;
}
