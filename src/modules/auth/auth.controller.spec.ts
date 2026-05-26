import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UnprocessableEntityException } from '@nestjs/common';

const mockLoginDto: LoginDto = {
  email: 'test@example.com',
  password: 'password',
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
});
