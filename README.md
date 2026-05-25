# PNC SPTS API

NestJS backend for the PNC SPTS project. This repository uses Prisma with MySQL, Docker Compose for local development, JWT auth endpoints, and Swagger-style API references.

## Features

- NestJS 11 backend
- Prisma ORM with MySQL
- Auth endpoints for register, login, and logout
- Swagger UI at `/api/docs`
- Auth reference page at `/api/auth/reference`
- phpMyAdmin for database inspection
- Redis service for future caching or background jobs

## Requirements

- Node.js 20+
- npm 9+
- Docker Desktop
- Docker Compose v2

## Quick Start With Docker

1. Install dependencies once on your machine:

```bash
npm install
```

2. Start the full stack:

```bash
docker compose up -d --build
```

3. Open the available services:

- API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api/docs
- Auth reference: http://localhost:3000/api/auth/reference
- phpMyAdmin: http://localhost:8081

## Login To phpMyAdmin

Use these values on the phpMyAdmin login page:

- Server: `mysql`
- Username: `super_admin`
- Password: `1234567`

The MySQL database name is `pnc_db`.

## Environment Variables

The development container reads [.env.development](.env.development). The important values are:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api
DATABASE_URL=mysql://super_admin:1234567@mysql:3306/pnc_db
PRISMA_CLIENT_ENGINE_TYPE=library
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=secret
JWT_EXPIRATION=3600s
JWT_REFRESH_SECRET=refresh-secret
JWT_REFRESH_EXPIRATION=7d
```

If you change the database password or username in Docker Compose, update `DATABASE_URL` too.

## Run Locally Without Docker

If you want to run only the API on your machine, make sure MySQL and Redis are available first, then:

```bash
npm install
npx prisma generate --schema=src/prisma/schema.prisma
npm run start:dev
```

The app listens on port 3000 by default.

## Useful Commands

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma migrate dev --name init
npx prisma db push
```

## Project Endpoints

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Documentation
- `GET /api/docs`
- `GET /api/auth/reference`

## Database

This project uses Prisma with MySQL. The schema is located at [src/prisma/schema.prisma](src/prisma/schema.prisma).

If you need to reset the local containers and database data:

```bash
docker compose down -v
docker compose up -d --build
```

## Notes

- Keep `.env.development` out of source control if it contains secrets.
- If phpMyAdmin shows a login error after changing database credentials, recreate the MySQL volume with `docker compose down -v` and start the stack again.
- The API is designed to run behind the global `/api` prefix configured in [src/main.ts](src/main.ts).
