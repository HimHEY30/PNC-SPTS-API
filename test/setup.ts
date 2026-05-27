// test/setup.ts — runs via setupFiles (before test framework)
// Only environment variable setup belongs here.

// Force DATABASE_URL and REDIS_HOST to localhost for local test execution
// (the .env file uses Docker service names like "mysql" and "redis")
process.env.DATABASE_URL = 'mysql://super_admin:1234567@localhost:3306/pnc_db';
process.env.REDIS_HOST = 'localhost';

// Now load .env for remaining variables (JWT secrets, etc.)
// dotenv won't override variables already set above
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
