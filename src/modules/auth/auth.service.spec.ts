import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { AuthLoginService } from './auth-login.service';
import { MailService } from '../mail/mail.service';

// Mock data
const mockUser = {
  id: 'user-id',
  email: 'teacher@example.com',
  password_hash: 'hashed-password',
  entity_type: 'teacher',
  is_active: true,
  status: 'ACTIVE',
  deletedAt: null,
  roles: [{ role: { name: 'TUTOR' } }],
};

const mockLoginDto: LoginDto = {
  email: 'teacher@example.com',
  password: 'Password123!',
};

const mockRefreshTokenDto: RefreshTokenDto = {
  refresh_token: 'valid-refresh-token',
};

const mockLogoutDto: LogoutDto = {
  refresh_token: 'valid-refresh-token',
};

describe('AuthService', () => {
  let service: AuthService;
  let repository: AuthRepository;
  let jwtService: JwtService;
  let authLoginService: AuthLoginService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
          {
            provide: MailService,
            useValue: { sendPasswordReset: jest.fn() },
          },
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
            findRefreshTokensByUserId: jest.fn(),
            rotateRefreshToken: jest.fn(),
            revokeRefreshTokenById: jest.fn(),
            revokeAllActiveRefreshTokensByUserId: jest.fn(),
            performTransaction: jest.fn(),
            createUser: jest.fn(),
            updatePassword: jest.fn(),
            createPasswordResetToken: jest.fn(),
            findUnusedResetTokensByUserId: jest.fn(),
            markResetTokenAsUsed: jest.fn(),
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
        {
          provide: AuthLoginService,
          useValue: {
            validateCredentials: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<AuthRepository>(AuthRepository);
    jwtService = module.get<JwtService>(JwtService);
    authLoginService = module.get<AuthLoginService>(AuthLoginService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      jest.spyOn(authLoginService, 'validateCredentials').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('test-token' as never);
      jest.spyOn(repository, 'performTransaction').mockResolvedValue(true as any);

      const result = await service.login(mockLoginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.expires_in).toBe(900);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      jest
        .spyOn(authLoginService, 'validateCredentials')
        .mockRejectedValue(new UnauthorizedException({ error: 'INVALID_CREDENTIALS' }));

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException({ error: 'INVALID_CREDENTIALS' }),
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      jest
        .spyOn(authLoginService, 'validateCredentials')
        .mockRejectedValue(new UnauthorizedException({ error: 'INVALID_CREDENTIALS' }));

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException({ error: 'INVALID_CREDENTIALS' }),
      );
    });

    it('should throw ForbiddenException for inactive account', async () => {
      jest
        .spyOn(authLoginService, 'validateCredentials')
        .mockRejectedValue(new ForbiddenException({ error: 'ACCOUNT_INACTIVE' }));

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
  // logout / logout-all
  // ---------------------------------------------------------------------------
  describe('logout', () => {
    it('should revoke the current refresh token and return 200 payload', async () => {
      jest.spyOn(repository, 'findRefreshTokensByUserId').mockResolvedValue([
        { id: 'rt-1', token_hash: 'stored-hash' },
      ] as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const revokeSpy = jest.spyOn(repository, 'revokeRefreshTokenById').mockResolvedValue({ count: 1 } as any);

      const result = await service.logout('user-id', mockLogoutDto);

      expect(revokeSpy).toHaveBeenCalledWith('rt-1');
      expect(result).toEqual({ message: 'OK' });
    });

    it('should return 200 payload when token is already revoked/non-active (idempotent)', async () => {
      jest.spyOn(repository, 'findRefreshTokensByUserId').mockResolvedValue([
        { id: 'rt-1', token_hash: 'stored-hash' },
      ] as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(repository, 'revokeRefreshTokenById').mockResolvedValue({ count: 0 } as any);

      const result = await service.logout('user-id', mockLogoutDto);
      expect(result).toEqual({ message: 'OK' });
    });
  });

  describe('logoutAll', () => {
    it('should revoke all active refresh tokens for the user', async () => {
      const revokeAllSpy = jest
        .spyOn(repository, 'revokeAllActiveRefreshTokensByUserId')
        .mockResolvedValue({ count: 2 } as any);

      const result = await service.logoutAll('user-id');

      expect(revokeAllSpy).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({ message: 'OK' });
    });

    it('should return 200 payload even when no active sessions exist', async () => {
      jest
        .spyOn(repository, 'revokeAllActiveRefreshTokensByUserId')
        .mockResolvedValue({ count: 0 } as any);

      const result = await service.logoutAll('user-id');
      expect(result).toEqual({ message: 'OK' });
    });
  });

  describe('forgotPassword', () => {
    it('should create a 6 digit reset code and send it by email', async () => {
      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(repository, 'findUnusedResetTokensByUserId').mockResolvedValue([]);
      jest.spyOn(repository, 'createPasswordResetToken').mockResolvedValue({ id: 'reset-id' } as any);
      jest.spyOn(mailService, 'sendPasswordReset').mockResolvedValue();
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-reset-code' as never);

      const result = await service.forgotPassword({ email: 'teacher@example.com' });

      expect(result).toEqual({ message: 'Password reset code sent' });
      expect(repository.createPasswordResetToken).toHaveBeenCalledWith(
        'user-id',
        'hashed-reset-code',
        expect.any(Date),
      );
      expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
        'teacher@example.com',
        expect.stringMatching(/^\d{6}$/),
      );
    });
  });

  describe('resetPassword', () => {
    it('should update password when the 6 digit reset code matches', async () => {
      const resetToken = {
        id: 'reset-id',
        token_hash: 'hashed-reset-code',
        expires_at: new Date(Date.now() + 60_000),
      };

      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(repository, 'findUnusedResetTokensByUserId').mockResolvedValue([resetToken] as any);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (plain: string, hash: string) => plain === '123456' && hash === 'hashed-reset-code');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-new-password' as never);
      jest.spyOn(repository, 'updatePassword').mockResolvedValue(mockUser as any);
      jest.spyOn(repository, 'markResetTokenAsUsed').mockResolvedValue(resetToken as any);
      jest.spyOn(repository, 'revokeAllActiveRefreshTokensByUserId').mockResolvedValue({ count: 1 } as any);

      const result = await service.resetPassword({
        email: 'teacher@example.com',
        token: '123456',
        newPassword: 'NewPassword123',
      });

      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(repository.updatePassword).toHaveBeenCalledWith('user-id', 'hashed-new-password');
      expect(repository.markResetTokenAsUsed).toHaveBeenCalledWith('reset-id');
      expect(repository.revokeAllActiveRefreshTokensByUserId).toHaveBeenCalledWith('user-id');
    });

    it('should reject a reset code that does not match', async () => {
      const resetToken = {
        id: 'reset-id',
        token_hash: 'hashed-reset-code',
        expires_at: new Date(Date.now() + 60_000),
      };

      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(repository, 'findUnusedResetTokensByUserId').mockResolvedValue([resetToken] as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.resetPassword({
          email: 'teacher@example.com',
          token: '654321',
          newPassword: 'NewPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const newUser = { id: 'new-id', email: 'chandyneat9999@gmail.com' } as any;
      jest.spyOn(repository, 'findUserByEmail').mockResolvedValue(null);
      jest.spyOn(repository, 'createUser').mockResolvedValue(newUser);
      const result = await service.register({
        email: 'chandyneat9999@gmail.com',
        password: 'Password123!',
      });
      expect(result).toEqual({ id: 'new-id', email: 'chandyneat9999@gmail.com' });
    });
  });
});
