import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../../database/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    role: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    permission: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    userRole: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if role already exists', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue({ id: '1', name: 'ADMIN' });

      await expect(
        service.create({ name: 'ADMIN', description: 'desc' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a custom role successfully', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);
      mockPrismaService.permission.upsert.mockResolvedValue({ id: '1', name: 'user.read' });
      mockPrismaService.role.create.mockResolvedValue({
        id: 'new-role-id',
        name: 'CUSTOM_ROLE',
        description: 'desc',
        permissions: [{ name: 'user.read' }],
      });

      const result = await service.create({
        name: 'CUSTOM_ROLE',
        description: 'desc',
        permissions: ['user.read'],
      });

      expect(result).toEqual({
        id: 'new-role-id',
        name: 'CUSTOM_ROLE',
        description: 'desc',
        permissions: ['user.read'],
      });
      expect(mockPrismaService.role.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      await expect(service.findOne('NON_EXISTENT')).rejects.toThrow(NotFoundException);
    });

    it('should return role if found', async () => {
      const mockRole = {
        id: 'role-id',
        name: 'CUSTOM_ROLE',
        description: 'desc',
        permissions: [{ name: 'user.read' }],
      };
      mockPrismaService.role.findFirst.mockResolvedValue(mockRole);

      const result = await service.findOne('CUSTOM_ROLE');
      expect(result).toEqual({
        id: 'role-id',
        name: 'CUSTOM_ROLE',
        description: 'desc',
        permissions: ['user.read'],
      });
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      await expect(service.remove('NON_EXISTENT')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to delete a system role', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue({
        id: '1',
        name: 'SUPER_ADMIN',
      });

      await expect(service.remove('SUPER_ADMIN')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if role has assigned users', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue({
        id: 'custom-role-id',
        name: 'CUSTOM_ROLE',
      });
      mockPrismaService.userRole.count.mockResolvedValue(5);

      await expect(service.remove('CUSTOM_ROLE')).rejects.toThrow(BadRequestException);
    });

    it('should delete role successfully', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue({
        id: 'custom-role-id',
        name: 'CUSTOM_ROLE',
      });
      mockPrismaService.userRole.count.mockResolvedValue(0);
      mockPrismaService.role.delete.mockResolvedValue({});

      const result = await service.remove('CUSTOM_ROLE');
      expect(result).toEqual({
        success: true,
        message: "Role 'CUSTOM_ROLE' was successfully deleted.",
      });
      expect(mockPrismaService.role.delete).toHaveBeenCalledWith({
        where: { id: 'custom-role-id' },
      });
    });
  });
});
