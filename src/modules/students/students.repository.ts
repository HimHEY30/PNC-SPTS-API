import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BaseRepository } from '../../database/base.repository';
import { Student, Prisma } from '@prisma/client';

@Injectable()
export class StudentsRepository extends BaseRepository<
  Student,
  Prisma.StudentUncheckedCreateInput,
  Prisma.StudentUncheckedUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma.student);
  }
}
