import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFollowUpReportDto {
  @IsString()
  teacherId: string;

  @IsOptional()
  @IsDateString()
  reportDate?: string;

  @IsOptional()
  @IsString()
  progressStatus?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;
}
