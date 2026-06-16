/**
 * main.ts  — bootstrap snippet
 * ─────────────────────────────────────────────────────────────────────────────
 * Add these lines to your existing main.ts so that:
 *   1. Uploaded images are served as static files at /uploads/…
 *   2. The PrismaExceptionFilter is registered globally.
 *
 * COPY ONLY what you need — do not replace your entire main.ts.
 *
 * ─── HOW IMAGE SERVING WORKS ─────────────────────────────────────────────────
 *
 * When a user uploads a profile image:
 *   • Multer saves the file to:  <cwd>/uploads/profile-images/<filename>
 *   • The DB stores the path:    /uploads/profile-images/<filename>
 *   • NestJS serves it at:       http(s)://<host>/uploads/profile-images/<filename>
 *
 * The useStaticAssets() call below is what connects the disk path to the URL.
 *
 * ─── DEPLOYING TO A SERVER ───────────────────────────────────────────────────
 *
 * The uploads/ folder must survive deploys.
 *
 * Option A — Docker volume (recommended):
 *   In docker-compose.yml / your Dockerfile:
 *     volumes:
 *       - uploads_data:/app/uploads
 *   Then `uploads_data` persists across container restarts.
 *
 * Option B — Symlink / bind mount on a VPS:
 *   Mount /data/uploads into the app at /app/uploads.
 *
 * Option C — Cloud storage later (S3, GCS, R2):
 *   Swap `diskStorage` in storage.config.ts for `multer-s3`.
 *   No controller changes needed.
 *
 * ─── ABSOLUTE URL FOR CLIENTS ────────────────────────────────────────────────
 *
 * The DB stores a relative path (/uploads/…).  If your frontend needs an
 * absolute URL, set APP_BASE_URL in your .env and prefix on the client:
 *
 *   const imageUrl = `${process.env.APP_BASE_URL}${user.profile_image}`;
 *   // → https://api.yourapp.com/uploads/profile-images/1234-abc.jpg
 */

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── Static file serving for uploaded images ──────────────────────────────
  // Files stored in <cwd>/uploads/ are accessible at GET /uploads/<path>.
  // This must come BEFORE any global prefix so the path resolves correctly.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ── Global prefix (if you use one) ───────────────────────────────────────
  // app.setGlobalPrefix('api');   ← keep this AFTER useStaticAssets

  // ── Global Prisma exception filter ───────────────────────────────────────
  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
