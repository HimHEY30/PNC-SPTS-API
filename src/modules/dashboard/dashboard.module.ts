import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, PrismaService],
})
export class DashboardModule {}
