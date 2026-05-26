import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserProfileController } from './user-profile/user-profile.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController, UserProfileController],
  providers: [UsersService],
})
export class UsersModule {}
