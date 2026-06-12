import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentsRepository } from './students.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentsRepository],
  exports: [StudentsService],
})
export class StudentsModule {}
