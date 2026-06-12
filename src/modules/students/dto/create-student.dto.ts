import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ description: 'Unique student code', example: 'STU-001' })
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: ['male', 'female', 'other'],
    example: 'male',
  })
  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: 'male' | 'female' | 'other';

  @ApiPropertyOptional({
    description: 'Date of birth (ISO 8601 or YYYY-MM-DD)',
    example: '2005-06-15',
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Place of birth',
    example: 'Kampong Cham',
  })
  @IsString()
  @IsOptional()
  placeOfBirth?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+85512345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Associated class ID',
    example: 'cmq9dg0y6002mo03k48lhhtij',
  })
  @IsString()
  @IsOptional()
  classId?: string;

  // Whitelisted metadata fields to prevent ValidationPipe (forbidNonWhitelisted: true)
  // from rejecting payloads that contain them (e.g. from copy-pasted DB rows or curl requests).
  @ApiPropertyOptional()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  profileImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  updatedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  deletedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  updatedBy?: string;
}
