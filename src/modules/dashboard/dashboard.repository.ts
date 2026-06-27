import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentsCount(beforeDate?: Date): Promise<number> {
    return this.prisma.student.count({
      where: {
        deletedAt: null,
        ...(beforeDate && { createdAt: { lt: beforeDate } }),
      },
    });
  }

  async getStudentsUnderFollowUpCount(beforeDate?: Date): Promise<number> {
    // Unique count of students with open/in-progress follow-up cases
    const result = await this.prisma.followUpCase.groupBy({
      by: ['studentId'],
      where: {
        deletedAt: null,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        ...(beforeDate && { createdAt: { lt: beforeDate } }),
      },
    });
    return result.length;
  }

  async getOpenCasesCount(beforeDate?: Date): Promise<number> {
    return this.prisma.followUpCase.count({
      where: {
        deletedAt: null,
        status: 'OPEN',
        ...(beforeDate && { createdAt: { lt: beforeDate } }),
      },
    });
  }

  async getResolvedCasesCount(beforeDate?: Date): Promise<number> {
    return this.prisma.followUpCase.count({
      where: {
        deletedAt: null,
        status: 'RESOLVED',
        ...(beforeDate && { createdAt: { lt: beforeDate } }),
      },
    });
  }

  async getRecentActivities(limit: number = 10) {
    return this.prisma.followUpCase.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        openedByTeacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        caseTypeMap: {
          include: {
            followUpType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }
}
