import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
