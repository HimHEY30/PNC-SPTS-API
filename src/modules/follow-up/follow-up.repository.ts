import { Injectable } from '@nestjs/common';
import { FollowUpCase, FollowUpStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCase(data: any): Promise<FollowUpCase> {
    return this.prisma.followUpCase.create({ data });
  }

  async findAll(skip: number, take: number): Promise<any[]> {
    return this.prisma.followUpCase.findMany({
      where: { deletedAt: null },
      skip,
      take,
      include: {
        student: true,
        openedByTeacher: true,
        term: true,
        caseTypeMap: {
          include: {
            followUpType: true,
          },
        },
        reports: {
          include: {
            attachments: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { reportDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBoardData(): Promise<any[]> {
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
        reports: {
          select: {
            id: true,
            reportDate: true,
            progressStatus: true,
            attachments: true,
          },
          orderBy: { reportDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<any | null> {
    return this.prisma.followUpCase.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: true,
        openedByTeacher: true,
        term: true,
        caseTypeMap: {
          include: {
            followUpType: true,
          },
        },
        reports: {
          include: {
            attachments: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        assignments: {
          include: {
            assignedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
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

  async createReport(data: {
    followUpCaseId: string;
    teacherId: string;
    reportDate?: Date;
    progressStatus?: string;
    observation?: string;
    nextAction?: string;
  }) {
    return this.prisma.followUpReport.create({
      data,
      include: {
        attachments: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findReportById(reportId: string) {
    return this.prisma.followUpReport.findUnique({
      where: { id: reportId },
      include: {
        followUpCase: {
          select: {
            id: true,
            deletedAt: true,
          },
        },
      },
    });
  }

  async createAttachment(data: {
    reportId: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    storageProvider?: string;
  }) {
    return this.prisma.followUpAttachment.create({
      data,
      include: {
        report: {
          select: {
            followUpCaseId: true,
          },
        },
      },
    });
  }

  async findAttachmentsByReportId(reportId: string) {
    return this.prisma.followUpAttachment.findMany({
      where: { reportId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findAssignableUser(id: string) {
    const user = await this.prisma.authUser.findFirst({
      where: { id, deletedAt: null, is_active: true },
      include: {
        roles: { include: { role: true } },
        teacher: true,
      },
    });
    if (user) return user;

    const teacher = await this.prisma.teacher.findFirst({
      where: { id, deletedAt: null, status: true },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
            teacher: true,
          },
        },
      },
    });

    return teacher?.user ?? null;
  }

  async findActorById(userId: string) {
    return this.prisma.authUser.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
      },
    });
  }

  async findAssignmentCaseById(caseId: string) {
    return this.prisma.followUpCase.findFirst({
      where: { id: caseId, deletedAt: null },
      include: {
        student: true,
        term: true,
        caseTypeMap: {
          include: {
            followUpType: true,
          },
        },
      },
    });
  }

  async assignCase(caseId: string, assignedByUserId: string, assignedToUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const activeAssignments = await tx.followUpCaseAssignment.findMany({
        where: {
          caseId,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
        orderBy: { assignedAt: 'desc' },
      });

      if (activeAssignments.length > 0) {
        await tx.followUpCaseAssignment.updateMany({
          where: {
            id: { in: activeAssignments.map((assignment) => assignment.id) },
          },
          data: {
            status: 'REJECTED',
            remarks: 'Reassigned to another teacher/tutor.',
          },
        });
      }

      const assignment = await tx.followUpCaseAssignment.create({
        data: {
          caseId,
          assignedByUserId,
          assignedToUserId,
          status: 'PENDING',
        },
        include: this.assignmentInclude(),
      });

      return {
        assignment,
        previousAssignment: activeAssignments[0] ?? null,
      };
    });
  }

  async findActiveAssignmentForCase(caseId: string) {
    return this.prisma.followUpCaseAssignment.findFirst({
      where: {
        caseId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      include: this.assignmentInclude(),
      orderBy: { assignedAt: 'desc' },
    });
  }

  async updateAssignmentStatus(
    assignmentId: string,
    data: {
      status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
      acceptedAt?: Date;
      completedAt?: Date;
      remarks?: string;
    },
  ) {
    return this.prisma.followUpCaseAssignment.update({
      where: { id: assignmentId },
      data,
      include: this.assignmentInclude(),
    });
  }

  async createAuditLog(data: {
    userId: string;
    userName?: string;
    action: 'CASE_ASSIGNED' | 'CASE_ACCEPTED' | 'CASE_REJECTED' | 'CASE_COMPLETED';
    entityType: string;
    entityId: string;
    previousStatus?: string | null;
    newStatus?: string | null;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  private assignmentInclude() {
    return {
      followUpCase: {
        include: {
          student: true,
          term: true,
          caseTypeMap: {
            include: {
              followUpType: true,
            },
          },
        },
      },
      assignedBy: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      },
    };
  }
}
