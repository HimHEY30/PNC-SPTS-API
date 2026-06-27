/**
 * scalar.types.ts
 * ───────────────
 * Shared TypeScript types for the Scalar documentation module.
 * Unchanged from the original – kept here for completeness.
 */

export interface ScalarDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: { name?: string; email?: string; url?: string };
  };
  servers?: Array<{ url: string; description?: string }>;
  components?: Record<string, unknown>;
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, unknown>;
}

// FIX: Export type alias to fix TS2305 error across all role spec files
export type SwaggerDocument = ScalarDocument;