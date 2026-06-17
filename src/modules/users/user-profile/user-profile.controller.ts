import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { UsersService } from '../users.service';

/**
 * UserProfileController — routes for the currently authenticated user.
 * No @Roles() restriction: any authenticated user may access their own profile.
 */
@ApiTags('User Profile')
@ApiSecurity('bearer')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserProfileController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/user/profile
   * Returns the full profile of the currently logged-in user from the database.
   * Accessible by any authenticated role (student, staff, admin, etc.).
   */
  @Get('profile')
  @Permissions('user.profile.read')
  @ApiOperation({ summary: "Get the current user's full profile" })
  async getProfile(@Req() req: Request) {
    return this.usersService.findOne(req.user.user_id);
  }
}
