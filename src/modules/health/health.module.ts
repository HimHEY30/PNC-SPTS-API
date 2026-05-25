import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '../../database/database.module'; // adjust path
import { HealthController } from './health.controller';

@Module({
  imports: [
    TerminusModule,
    DatabaseModule, // 👈 add this
  ],
  controllers: [HealthController],
})
export class HealthModule {}