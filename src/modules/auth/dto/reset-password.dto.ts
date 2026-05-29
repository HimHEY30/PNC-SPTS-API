import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Token must be a 6 digit code' })
  @Transform(({ value }) => value?.trim())
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
