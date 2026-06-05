import { Module } from '@nestjs/common';
import { FollowUpController } from './follow-up.controller';
import { FollowUpService } from './follow-up.service';
import { FollowUpRepository } from './follow-up.repository';
import { PrismaService } from '../../database/prisma.service'; // adjust path as needed

@Module({
  imports: [],
  controllers: [FollowUpController],
  providers: [FollowUpService, FollowUpRepository, PrismaService],
})
export class FollowUpModule {}
