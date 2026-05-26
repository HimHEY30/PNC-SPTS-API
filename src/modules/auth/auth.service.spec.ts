import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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

const mockRegisterDto: RegisterDto = {
  email: 'newuser@example.com',
  password: 'Password123!',
};

const mockRefreshTokenDto: RefreshTokenDto = {
  refresh_token: 'valid-refresh-token',
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
            findUserById: jest.fn(),
            findRefreshTokensByUserId: jest.fn(),
            rotateRefreshToken: jest.fn(),
            performTransaction: jest.fn(),
            createUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
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

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // refresh
  // ---------------------------------------------------------------------------
  describe('refresh', () => {
    it('should return new token pair for valid refresh token', async () => {
      const activeStoredToken = {
        id: 'rt-1',
        token_hash: 'stored-hash',
        expires_at: new Date(Date.now() + 60_000),
        revoked_at: null,
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ user_id: 'user-id' } as never);
      jest.spyOn(repository, 'findRefreshTokensByUserId').mockResolvedValue([activeStoredToken] as any);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (plain: string, hash: string) => plain === 'valid-refresh-token' && hash === 'stored-hash');
      jest.spyOn(repository, 'findUserById').mockResolvedValue(mockUser as any);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('new-access-token' as never)
        .mockResolvedValueOnce('new-refresh-token' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-refresh-hash' as never);
      jest.spyOn(repository, 'rotateRefreshToken').mockResolvedValue(true as any);

      const result = await service.refresh(mockRefreshTokenDto);

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 900,
      });
    });

    it('should revoke old refresh token after rotation', async () => {
      const activeStoredToken = {
        id: 'rt-1',
        token_hash: 'stored-hash',
        expires_at: new Date(Date.now() + 60_000),
        revoked_at: null,
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ user_id: 'user-id' } as never);
      jest.spyOn(repository, 'findRefreshTokensByUserId').mockResolvedValue([activeStoredToken] as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(repository, 'findUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-refresh-hash' as never);
      const rotateSpy = jest.spyOn(repository, 'rotateRefreshToken').mockResolvedValue(true as any);

      await service.refresh(mockRefreshTokenDto);

      expect(rotateSpy).toHaveBeenCalledWith(
        'rt-1',
        'user-id',
        'new-refresh-hash',
        expect.any(Date),
      );
    });

    it('should throw TOKEN_REVOKED for reused revoked refresh token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ user_id: 'user-id' } as never);
      jest.spyOn(repository, 'findRefreshTokensByUserId').mockResolvedValue([
        {
          id: 'rt-1',
          token_hash: 'stored-hash',
          expires_at: new Date(Date.now() + 60_000),
          revoked_at: new Date(),
        },
      ] as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new UnauthorizedException({ error: 'TOKEN_REVOKED' }),
      );
    });

    it('should throw TOKEN_EXPIRED for expired refresh token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ user_id: 'user-id' } as never);
      jest.spyOn(repository, 'findRefreshTokensByUserId').mockResolvedValue([
        {
          id: 'rt-1',
          token_hash: 'stored-hash',
          expires_at: new Date(Date.now() - 60_000),
          revoked_at: null,
        },
      ] as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new UnauthorizedException({ error: 'TOKEN_EXPIRED' }),
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ user_id: 'user-id' } as never);
      jest.spyOn(repository, 'findRefreshTokensByUserId').mockResolvedValue([
        {
          id: 'rt-1',
          token_hash: 'stored-hash',
          expires_at: new Date(Date.now() + 60_000),
          revoked_at: null,
        },
      ] as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new UnauthorizedException({ error: 'INVALID_TOKEN' }),
      );
    });

    it('should throw validation error when refresh token is missing', async () => {
      await expect(service.refresh({ refresh_token: '' })).rejects.toThrow(
        new Error('VALIDATION_ERROR'),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------
  describe('register', () => {
    it('should create and return a new user', async () => {
      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(null);
      jest.spyOn(repository, 'createUser').mockResolvedValue({
        id: 'new-user-id',
        email: mockRegisterDto.email,
      } as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const result = await service.register(mockRegisterDto);

      expect(result).toEqual({ id: 'new-user-id', email: mockRegisterDto.email });
      expect(repository.createUser).toHaveBeenCalledWith(
        mockRegisterDto.email,
        'hashed-password',
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(mockUser as any);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        new ConflictException({ error: 'USER_ALREADY_EXISTS' }),
      );
    });
  });
});
