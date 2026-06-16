/**
 * create-user.dto.ts
 *
 * Supports two mutually-exclusive image input strategies:
 *   1. Local file upload  — handled via FileInterceptor; controller populates
 *      `profileImage` after saving the file (no DTO field needed for the file
 *      itself, it arrives as multipart).
 *   2. Remote image URL   — caller supplies `profileImageUrl` in the form body.
 *
 * Resolution priority (enforced in the controller, not here):
 *   uploaded file  >  profileImageUrl  >  undefined
 *
 * Sensitive fields
 * ────────────────
 * • password   — strength regex + @Exclude() on serialisation (see interceptor)
 * • email      — normalised to lower-case by a transform pipe
 * • phone      — optional, E.164 format enforced
 */

import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Supported role values — keep in sync with your Role seed data. */
export const SUPPORTED_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'TEACHER',
  'STUDENT',
  'STAFF',
] as const;

export type SupportedRole = (typeof SUPPORTED_ROLES)[number];

export class CreateUserDto {
  // ── Identity ──────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty({ message: 'first_name must not be empty' })
  @MaxLength(100, { message: 'first_name must not exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  first_name: string;

  @IsString()
  @IsNotEmpty({ message: 'last_name must not be empty' })
  @MaxLength(100, { message: 'last_name must not exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  last_name: string;

  // ── Sensitive: email ──────────────────────────────────────────────────────

  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email must not be empty' })
  @MaxLength(255, { message: 'email must not exceed 255 characters' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email: string;

  // ── Sensitive: password ───────────────────────────────────────────────────

  /**
   * Minimum 8 characters, at least:
   *   • one uppercase letter
   *   • one lowercase letter
   *   • one digit
   *   • one special character
   *
   * Never returned in API responses — strip via ClassSerializerInterceptor
   * or the toUserResponse() mapper in UsersService.
   */
  @IsString()
  @IsNotEmpty({ message: 'password must not be empty' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, {
    message:
      'password must include at least one uppercase letter, one lowercase letter, one digit, and one special character',
  })
  password: string;

  // ── Contact ───────────────────────────────────────────────────────────────

  /**
   * E.164 format is enforced (e.g. +85512345678).
   * Accepts any locale — pass 'any' to IsMobilePhone.
   */
  @IsOptional()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message:
      'phone must be a valid E.164 phone number (e.g. +85512345678)',
  })
  phone?: string;

  // ── Role ──────────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty({ message: 'role must not be empty' })
  @IsIn(SUPPORTED_ROLES, {
    message: `role must be one of: ${SUPPORTED_ROLES.join(', ')}`,
  })
  role: SupportedRole;

  // ── Profile image — strategy 1: URL ───────────────────────────────────────

  /**
   * Optional remote image URL.
   * Ignored when an actual file is uploaded (file takes priority).
   * The controller resolves the final `profileImage` value before calling
   * the service.
   */
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_tld: true },
    { message: 'profileImageUrl must be a valid HTTP/HTTPS URL' },
  )
  @MaxLength(2048, { message: 'profileImageUrl must not exceed 2048 characters' })
  profileImageUrl?: string;

  // ── Profile image — strategy 2: local file upload ─────────────────────────

  /**
   * Populated by the controller after Multer saves the uploaded file.
   * Never sent by the client directly — it is injected server-side.
   * Declared here so the service can read it from the DTO without casting.
   */
  @IsOptional()
  @IsString()
  profileImage?: string;
}