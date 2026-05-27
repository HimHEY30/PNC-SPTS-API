import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

/**
 * UserProfileController — routes for the currently authenticated user.
 * No @Roles() restriction: any authenticated user may access their own profile.
 */
@Controller('user')
export class UserProfileController {
  /**
   * GET /api/user/profile
   * Returns the JWT-decoded payload of the currently logged-in user.
   * Accessible by any authenticated role (student, staff, admin, etc.).
   */
  @Get('profile')
  @Permissions('user.profile.read')
  getProfile(@Req() req: Request): AuthenticatedUser {
    // JwtAuthGuard injects the authenticated user into req.user
    return req.user as AuthenticatedUser;
  }
}
