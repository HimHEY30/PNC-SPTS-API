export interface SwaggerDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  components?: Record<string, unknown>;
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, unknown>;
}
