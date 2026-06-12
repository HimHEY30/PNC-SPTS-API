import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up database before tests
    await prisma.refreshToken.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.authUser.deleteMany();
    await prisma.role.deleteMany();

    // Seed necessary data
    const role = await prisma.role.create({
      data: {
        name: 'teacher',
        description: 'Teacher role',
      },
    });

    const passwordHash = await bcrypt.hash('Password123!', 12);
    const user = await prisma.authUser.create({
      data: {
        email: 'teacher@example.com',
        password_hash: passwordHash,
        entity_type: 'teacher',
        first_name: 'Test',
        last_name: 'Teacher',
        is_active: true,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    const inactiveUser = await prisma.authUser.create({
      data: {
        email: 'inactive@example.com',
        password_hash: passwordHash,
        entity_type: 'teacher',
        first_name: 'Inactive',
        last_name: 'Teacher',
        is_active: false,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: inactiveUser.id,
        roleId: role.id,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/login (POST)', () => {
    it('should return tokens for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'teacher@example.com', password: 'Password123!' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body.expires_in).toBe(900);
        });
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nouser@example.com', password: 'Password123!' })
        .expect(401)
        .expect({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'INVALID_CREDENTIALS',
        });
    });

    it('should return 401 for incorrect password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'teacher@example.com', password: 'wrongpassword' })
        .expect(401)
        .expect({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'INVALID_CREDENTIALS',
        });
    });

    it('should return 403 for inactive user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'inactive@example.com', password: 'Password123!' })
        .expect(403)
        .expect({
          statusCode: 403,
          message: 'Forbidden',
          error: 'ACCOUNT_INACTIVE',
        });
    });

    it('should return 422 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'Password123!' })
        .expect(422)
        .expect({
          statusCode: 422,
          message: 'Unprocessable Entity',
          error: 'VALIDATION_ERROR',
        });
    });

    it('should return 422 for missing password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'teacher@example.com' })
        .expect(422)
        .expect({
          statusCode: 422,
          message: 'Unprocessable Entity',
          error: 'VALIDATION_ERROR',
        });
    });
  });

  describe('/api/auth/logout and /api/auth/logout-all (POST)', () => {
    it('should reject unauthorized logout request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({ refresh_token: 'x' })
        .expect(401);
    });

    it('should reject unauthorized logout-all request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout-all')
        .send({})
        .expect(401);
    });
  });
});
