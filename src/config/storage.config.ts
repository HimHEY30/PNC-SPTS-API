/**
 * storage.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Multer storage configuration for all file-upload endpoints.
 *
 * HOW LOCAL STORAGE + STATIC SERVING WORKS
 * ─────────────────────────────────────────
 * 1. Files are saved to  <project-root>/uploads/profile-images/
 * 2. In main.ts (or AppModule) register NestJS static assets:
 *
 *      app.useStaticAssets(join(process.cwd(), 'uploads'), {
 *        prefix: '/uploads/',
 *      });
 *
 * 3. Every uploaded file is then reachable at:
 *      http(s)://<host>/uploads/profile-images/<filename>
 *
 * 4. The path stored in the database is the relative URL path:
 *      /uploads/profile-images/<filename>
 *    Prepend your BASE_URL env var on the client when you need an absolute URL.
 *
 * WHEN DEPLOYING TO A SERVER
 * ──────────────────────────
 * • Make sure the `uploads/` directory is on a persistent volume (not wiped on
 *   deploy). On Docker: mount a named volume to /app/uploads.
 * • If you move to S3/GCS later, swap diskStorage for multer-s3 here — no
 *   controller changes needed.
 */

import { BadRequestException } from '@nestjs/common';
import { diskStorage, StorageEngine } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum file size accepted for profile images (bytes). */
export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** MIME types that are accepted for profile images. */
export const PROFILE_IMAGE_ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * URL prefix used when serving uploaded files.
 * Must match the `prefix` passed to useStaticAssets() in main.ts.
 */
export const UPLOADS_URL_PREFIX = '/uploads';

// ─── Disk storage ─────────────────────────────────────────────────────────────

/**
 * Multer diskStorage engine for profile images.
 *
 * Destination: <cwd>/uploads/profile-images/
 * Filename   : <timestamp>-<random>.<ext>
 */
export const profileImageStorage: StorageEngine = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'profile-images');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

// ─── MIME filter ──────────────────────────────────────────────────────────────

/**
 * Multer fileFilter that rejects files whose MIME type is not in the whitelist.
 * Pass this to FileInterceptor options as `fileFilter`.
 */
export const profileImageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (PROFILE_IMAGE_ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Unsupported file type "${file.mimetype}". ` +
          `Allowed types: ${PROFILE_IMAGE_ALLOWED_MIME.join(', ')}.`,
      ),
      false,
    );
  }
};

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Given the filename Multer assigned, return the URL path to store in the DB
 * and return to clients.
 *
 * Example: toUploadUrl('profile-images', '1234-abc.jpg')
 *          → '/uploads/profile-images/1234-abc.jpg'
 */
export function toUploadUrl(subdir: string, filename: string): string {
  return `${UPLOADS_URL_PREFIX}/${subdir}/${filename}`;
}
