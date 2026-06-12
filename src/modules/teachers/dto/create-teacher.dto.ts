import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({ example: 'TCH-001' })
  @IsString()
  @IsNotEmpty()
  teacherCode: string;

  @ApiProperty({ example: 'Chantrea' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Keo' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'chantrea.keo@pnc.edu.kh' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+855 12 345 678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsOptional()
  profileImage?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;
}
