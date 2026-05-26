import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { UnprocessableEntityException } from '@nestjs/common';

const mockLoginDto: LoginDto = {
  email: 'test@example.com',
  password: 'password',
};

const mockRefreshTokenDto: RefreshTokenDto = {
  refresh_token: 'refresh-token',
};

const mockLogoutDto: LogoutDto = {
  refresh_token: 'refresh-token',
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            logoutAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const result = { access_token: 'token', refresh_token: 'refresh', expires_in: 900 };
      jest.spyOn(service, 'login').mockResolvedValue(result);

      expect(await controller.login(mockLoginDto)).toBe(result);
      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
    });

    it('should throw UnprocessableEntityException on validation error', async () => {
      jest.spyOn(service, 'login').mockRejectedValue(new Error('VALIDATION_ERROR'));

      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        new UnprocessableEntityException({ error: 'VALIDATION_ERROR' }),
      );
    });

    it('should re-throw other errors', async () => {
        const error = new Error('Some other error');
        jest.spyOn(service, 'login').mockRejectedValue(error);
  
        await expect(controller.login(mockLoginDto)).rejects.toThrow(error);
      });
  });

  describe('refresh', () => {
    it('should call authService.refresh and return the result', async () => {
      const result = { access_token: 'token', refresh_token: 'new-refresh', expires_in: 900 };
      jest.spyOn(service, 'refresh').mockResolvedValue(result as any);

      expect(await controller.refresh(mockRefreshTokenDto)).toBe(result);
      expect(service.refresh).toHaveBeenCalledWith(mockRefreshTokenDto);
    });

    it('should throw UnprocessableEntityException on validation error', async () => {
      jest.spyOn(service, 'refresh').mockRejectedValue(new Error('VALIDATION_ERROR'));

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new UnprocessableEntityException({ error: 'VALIDATION_ERROR' }),
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return the result', async () => {
      const result = { message: 'OK' };
      const req = { user: { user_id: 'user-id' } } as any;
      jest.spyOn(service, 'logout').mockResolvedValue(result as any);

      expect(await controller.logout(req, mockLogoutDto)).toBe(result);
      expect(service.logout).toHaveBeenCalledWith('user-id', mockLogoutDto);
    });

    it('should throw UnprocessableEntityException on validation error', async () => {
      const req = { user: { user_id: 'user-id' } } as any;
      jest.spyOn(service, 'logout').mockRejectedValue(new Error('VALIDATION_ERROR'));

      await expect(controller.logout(req, mockLogoutDto)).rejects.toThrow(
        new UnprocessableEntityException({ error: 'VALIDATION_ERROR' }),
      );
    });
  });

  describe('logoutAll', () => {
    it('should call authService.logoutAll and return the result', async () => {
      const result = { message: 'OK' };
      const req = { user: { user_id: 'user-id' } } as any;
      jest.spyOn(service, 'logoutAll').mockResolvedValue(result as any);

      expect(await controller.logoutAll(req)).toBe(result);
      expect(service.logoutAll).toHaveBeenCalledWith('user-id');
    });
  });
});
