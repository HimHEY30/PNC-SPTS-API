import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'first_name must not exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'last_name must not exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  last_name?: string;

  @IsOptional()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phone must be a valid E.164 phone number (e.g. +85512345678)',
  })
  phone?: string;

  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_tld: true },
    { message: 'profileImageUrl must be a valid HTTP/HTTPS URL' },
  )
  @MaxLength(2048, { message: 'profileImageUrl must not exceed 2048 characters' })
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  twitter_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  facebook_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedin_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pinterest_url?: string;
}
