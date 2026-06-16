/**
 * update-user.dto.ts
 *
 * Supports two mutually-exclusive image input strategies (same as CreateUserDto):
 *   1. Local file upload  — Multer saves the file; controller populates `profileImage`
 *   2. Remote image URL   — caller supplies `profileImageUrl` in the form body
 *
 * Resolution priority (enforced in the controller):
 *   uploaded file  >  profileImageUrl  >  keep existing image (no change)
 *
 * All fields are optional — partial updates are fully supported.
 *
 * Sensitive fields
 * ────────────────
 * • phone  — E.164 format enforced when provided
 * • email  — intentionally NOT updatable here (use a dedicated
 *            change-email flow with re-verification)
 */

import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  // ── Identity ──────────────────────────────────────────────────────────────

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

  // ── Contact ───────────────────────────────────────────────────────────────

  /**
   * E.164 format enforced (e.g. +85512345678).
   * Uniqueness check is performed in UsersService.update().
   */
  @IsOptional()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phone must be a valid E.164 phone number (e.g. +85512345678)',
  })
  phone?: string;

  // ── Profile image — strategy 1: remote URL ────────────────────────────────

  /**
   * Optional remote image URL supplied in the form body.
   * Ignored when an actual file is also uploaded (file takes priority).
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
   * Never sent directly by the client — injected server-side only.
   * When undefined, the service leaves the existing profileImage unchanged.
   */
  @IsOptional()
  @IsString()
  profileImage?: string;
}