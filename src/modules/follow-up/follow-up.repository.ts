import { Injectable } from '@nestjs/common';
import { FollowUpCase } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCase(data: Partial<FollowUpCase>): Promise<FollowUpCase> {
    return this.prisma.followUpCase.create({ data: data as any });
  }

  async findAll(skip: number, take: number): Promise<FollowUpCase[]> {
    return this.prisma.followUpCase.findMany({ skip, take });
  }

  async findOne(id: string): Promise<FollowUpCase | null> {
    return this.prisma.followUpCase.findUnique({ where: { id } });
  }

  async updateCase(id: string, data: Partial<FollowUpCase>): Promise<FollowUpCase> {
    return this.prisma.followUpCase.update({ where: { id }, data: data as any });
  }

  async removeCase(id: string): Promise<FollowUpCase> {
    return this.prisma.followUpCase.delete({ where: { id } });
  }
}
