/**
 * users.module.ts
 *
 * Registers MulterModule so the FileInterceptor in UsersController
 * has a default storage configuration at module level.
 * Route-level overrides in the controller take full precedence.
 */

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { DatabaseModule } from '@/database/database.module';
import {
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  profileImageFileFilter,
  profileImageStorage,
} from '../../config/storage.config';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfileController } from './user-profile/user-profile.controller';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({
      storage: profileImageStorage,
      fileFilter: profileImageFileFilter,
      limits: { fileSize: PROFILE_IMAGE_MAX_SIZE_BYTES },
    }),
  ],
  controllers: [UsersController, UserProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}