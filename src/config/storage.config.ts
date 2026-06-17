/**
 * storage.config.ts
 * src/config/storage.config.ts
 *
 * Centralised Multer storage configuration.
 *
 * Responsibilities
 * ────────────────
 * • diskStorage  — saves uploaded files under /uploads/profile-images/
 * • fileFilter   — rejects non-image MIME types (JPEG, PNG, WEBP, GIF)
 * • size cap     — 5 MB hard limit per file
 * • toUploadUrl  — converts a stored filename to a server-relative URL
 *
 * Usage
 * ─────
 * Import the four exports into controllers:
 *
 *   import {
 *     PROFILE_IMAGE_MAX_SIZE_BYTES,
 *     profileImageFileFilter,
 *     profileImageStorage,
 *     toUploadUrl,
 *   } from '../../config/storage.config';
 */

import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// ── Constants ────────────────────────────────────────────────────────────────

/** 5 MB in bytes */
export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** MIME types accepted for profile images */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// ── Multer disk storage ──────────────────────────────────────────────────────

/**
 * Saves files to  /uploads/profile-images/<uuid><ext>
 *
 * The destination directory must exist before the application starts.
 * Create it with:
 *   mkdir -p uploads/profile-images
 */
export const profileImageStorage = diskStorage({
  destination: './uploads/profile-images',
  filename: (_req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
    callback(null, uniqueName);
  },
});

// ── Extension → MIME fallback ────────────────────────────────────────────────

/**
 * Maps common image file extensions to their MIME type.
 * Used as a fallback when the client sends `application/octet-stream`.
 */
const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// ── MIME whitelist ───────────────────────────────────────────────────────────

/**
 * Multer fileFilter — rejects uploads whose MIME type is not in the allowlist.
 * A-02: throws BadRequestException (HTTP 400) for unsupported types.
 *
 * When a client sends a file with `application/octet-stream` (e.g. Postman,
 * curl, or some frontend libraries that don't set per-part Content-Type),
 * we fall back to detecting the MIME type from the file extension.
 */
export const profileImageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void => {
  let { mimetype } = file;

  // Fallback: derive MIME type from the file extension when the client
  // did not set a specific Content-Type on the multipart part.
  if (mimetype === 'application/octet-stream') {
    const ext = extname(file.originalname).toLowerCase();
    mimetype = EXT_TO_MIME[ext] ?? mimetype;
    file.mimetype = mimetype; // propagate the corrected type downstream
  }

  if (ALLOWED_MIME_TYPES.has(mimetype)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException(
        `Unsupported image type "${mimetype}". ` +
          `Allowed types: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      ),
      false,
    );
  }
};

// ── URL builder ──────────────────────────────────────────────────────────────

/**
 * Converts a Multer-saved filename into a server-relative URL path.
 *
 * @example
 *   toUploadUrl('profile-images', 'abc123.jpg')
 *   // → '/uploads/profile-images/abc123.jpg'
 */
export const toUploadUrl = (folder: string, filename: string): string =>
  `/uploads/${folder}/${filename}`;

/**
 * Converts a relative upload path to an absolute live URL.
 */
export const toLiveImageUrl = (path: string | null | undefined, providedBaseUrl?: string): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const baseUrl = providedBaseUrl || process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
};