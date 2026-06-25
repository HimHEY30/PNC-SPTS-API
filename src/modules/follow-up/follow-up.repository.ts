import { Injectable } from '@nestjs/common';
import { FollowUpCase, FollowUpStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCase(data: any): Promise<FollowUpCase> {
    return this.prisma.followUpCase.create({ data });
  }

  async findAll(skip: number, take: number): Promise<FollowUpCase[]> {
    return this.prisma.followUpCase.findMany({
      where: { deletedAt: null },
      skip,
      take,
      include: {
        student: true,
        openedByTeacher: true,
      },
    });
  }

  async findBoardData(): Promise<FollowUpCase[]> {
    return this.prisma.followUpCase.findMany({
      where: { deletedAt: null },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentCode: true,
            profileImage: true,
          },
        },
        openedByTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<FollowUpCase | null> {
    return this.prisma.followUpCase.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: true,
        openedByTeacher: true,
      },
    });
  }

  async updateCase(id: string, data: any): Promise<FollowUpCase> {
    return this.prisma.followUpCase.update({
      where: { id },
      data,
    });
  }

  async removeCase(id: string): Promise<FollowUpCase> {
    return this.prisma.followUpCase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
