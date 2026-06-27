export interface SwaggerEnvironment {
  name: string;
  url: string;
  description: string;
}

export const SWAGGER_PORTAL = {
  title: 'PNC SPTS API Integration Portal',
  version: '1.0.0',
  publicTitle: 'PNC SPTS — Public Auth Reference',
  contact: {
    name: 'PNC SPTS Backend Team',
    email: 'backend@pnc-spts.example.com',
  },
} as const;

/** Environment base URLs — override via env vars in production deployments. */
export const SWAGGER_ENVIRONMENTS: SwaggerEnvironment[] = [
  {
    name: 'Local',
    url: process.env.SWAGGER_LOCAL_URL || 'http://localhost:3000/api',
    description: 'Local development server',
  },
  {
    name: 'Development',
    url: process.env.SWAGGER_DEV_URL || 'http://localhost:3000/api',
    description: 'Development environment',
  },
  {
    name: 'Staging',
    url: process.env.SWAGGER_STAGING_URL || 'https://pnc-spts-stg-api.me/api',
    description: 'Staging environment',
  },
  {
    name: 'Production',
    url: process.env.SWAGGER_PROD_URL || 'https://api.pnc-spts.example.com/api',
    description: 'Production environment',
  },
];

export const SWAGGER_SECURITY_SCHEME = {
  bearerAuth: {
    type: 'http' as const,
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description:
      'JWT access token obtained from `POST /auth/login`. ' +
      'Swagger UI auto-authorizes after a successful login when using the Integration Portal.',
  },
};
