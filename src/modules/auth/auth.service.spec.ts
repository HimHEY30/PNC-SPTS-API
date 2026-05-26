import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

// Mock data
const mockUser = {
  id: 'user-id',
  email: 'teacher@example.com',
  password_hash: 'hashed-password',
  entity_type: 'teacher',
  is_active: true,
  roles: [{ role: { name: 'teacher' } }],
};

const mockLoginDto: LoginDto = {
  email: 'teacher@example.com',
  password: 'Password123!',
};

describe('AuthService', () => {
  let service: AuthService;
  let repository: AuthRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            performTransaction: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<AuthRepository>(AuthRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('test-token' as never);
      jest.spyOn(repository, 'performTransaction').mockResolvedValue(true as any);

      const result = await service.login(mockLoginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.expires_in).toBe(900);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException({ error: 'INVALID_CREDENTIALS' }),
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException({ error: 'INVALID_CREDENTIALS' }),
      );
    });

    it('should throw ForbiddenException for inactive account', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(inactiveUser as any);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new ForbiddenException({ error: 'ACCOUNT_INACTIVE' }),
      );
    });
  });
});
