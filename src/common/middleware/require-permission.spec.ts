import { requirePermission } from './require-permission.middleware';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    role: {
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
  };
});

describe('requirePermission Middleware', () => {
  let prismaMock: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    prismaMock = new PrismaClient();
    req = {
      user: {
        roles: ['TUTOR'],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 Forbidden if user has no roles or is not authenticated', async () => {
    req.user = undefined;
    const middleware = requirePermission('student:read');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'FORBIDDEN',
      required: 'student:read',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should bypass all permission checks if user is SUPER_ADMIN', async () => {
    req.user.roles = ['SUPER_ADMIN'];
    const middleware = requirePermission('student:read');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should bypass all permission checks if user is ADMIN', async () => {
    req.user.roles = ['ADMIN'];
    const middleware = requirePermission('student:read');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should pass if user has exactly matching permission', async () => {
    prismaMock.role.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'TUTOR',
        permissions: [{ name: 'student.read' }],
      },
    ]);

    const middleware = requirePermission('student:read');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should pass if user has matching wildcard permission', async () => {
    prismaMock.role.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'TUTOR',
        permissions: [{ name: 'student.*' }],
      },
    ]);

    const middleware = requirePermission('student:read');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should support underscore normalized matching', async () => {
    prismaMock.role.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'TUTOR',
        permissions: [{ name: 'followup.close' }],
      },
    ]);

    const middleware = requirePermission('follow_up:close');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 Forbidden with exact payload if user does not have permission', async () => {
    prismaMock.role.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'TUTOR',
        permissions: [{ name: 'student.read' }],
      },
    ]);

    const middleware = requirePermission('student:write');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'FORBIDDEN',
      required: 'student:write',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
