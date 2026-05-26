import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('user')
export class UserProfileController {
  @Get('profile')
  getProfile(@Req() req: Request) {
    // JwtAuthGuard injects the authenticated user into req.user
    return req.user;
  }
}
