import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateNextTeacherId(): Promise<string> {
    const lastTeacher = await this.prisma.teacher.findFirst({
      where: {
        teacher_id: {
          startsWith: 'T',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let lastNum = 0;
    if (lastTeacher && lastTeacher.teacher_id) {
      const match = lastTeacher.teacher_id.match(/^T(\d+)$/);
      if (match) {
        lastNum = parseInt(match[1], 10);
      }
    }

    const nextNum = lastNum + 1;
    return `T${String(nextNum).padStart(2, '0')}`;
  }

  async create(data: any) {
    if (data.teacherCode) {
      const existingCode = await this.prisma.teacher.findFirst({
        where: { teacherCode: data.teacherCode, deletedAt: null },
      });
      if (existingCode) {
        throw new ConflictException({
          error: 'TEACHER_CODE_ALREADY_EXISTS',
          message: 'Teacher code already exists.',
        });
      }
    }

    let userId = data.userId;
    if (!userId && data.email) {
      let authUser = await this.prisma.authUser.findUnique({
        where: { email: data.email },
      });
      if (authUser) {
        // If the user already has a teacher profile, throw conflict
        const existingTeacher = await this.prisma.teacher.findUnique({
          where: { userId: authUser.id },
        });
        if (existingTeacher && !existingTeacher.deletedAt) {
          throw new ConflictException({
            error: 'USER_ALREADY_HAS_TEACHER_PROFILE',
            message: 'This user email is already registered as a teacher.',
          });
        }
        if (data.profileImage) {
          await this.prisma.authUser.update({
            where: { id: authUser.id },
            data: { profileImage: data.profileImage },
          });
        }
        userId = authUser.id;
      } else {
        // Create new AuthUser
        const role = await this.prisma.role.findUnique({
          where: { name: 'TUTOR' },
        });
        const passwordHash = await bcrypt.hash('Password123!', 12);
        authUser = await this.prisma.authUser.create({
          data: {
            email: data.email,
            password_hash: passwordHash,
            entity_type: 'teacher',
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            profileImage: data.profileImage,
            is_active: data.status !== false,
            status: data.status !== false ? 'ACTIVE' : 'INACTIVE',
            roles: role
              ? {
                  create: {
                    role: { connect: { id: role.id } },
                  },
                }
              : undefined,
          },
        });
        userId = authUser.id;
      }
    }

    if (!userId) {
      throw new ConflictException({
        error: 'USER_ID_OR_EMAIL_REQUIRED',
        message: 'Either userId or email must be provided to create a teacher.',
      });
    }

    const teacherIdFormatted = await this.generateNextTeacherId();

    const teacher = await this.prisma.teacher.create({
      data: {
        teacher_id: teacherIdFormatted,
        teacherCode: data.teacherCode,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        status: data.status !== false,
        userId: userId,
        createdBy: data.createdBy,
      },
      include: {
        user: true,
        teacherSubjects: true,
        tutorAssignments: {
          where: { status: 'active' },
        },
      },
    });

    return {
      id: teacher.id,
      teacher_id: teacher.teacher_id,
      teacherCode: teacher.teacherCode,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone,
      status: teacher.status,
      userId: teacher.userId,
      email: teacher.user?.email ?? '',
      profileImage: teacher.user?.profileImage ?? null,
      sections: teacher.teacherSubjects.length,
      students: teacher.tutorAssignments.length,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      deletedAt: teacher.deletedAt,
      createdBy: teacher.createdBy,
      updatedBy: teacher.updatedBy,
    };
  }

  async findAll() {
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
        teacherSubjects: true,
        tutorAssignments: {
          where: { status: 'active' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return teachers.map((t) => ({
      id: t.id,
      teacher_id: t.teacher_id,
      teacherCode: t.teacherCode,
      firstName: t.firstName,
      lastName: t.lastName,
      phone: t.phone,
      status: t.status,
      userId: t.userId,
      email: t.user?.email ?? '',
      profileImage: t.user?.profileImage ?? null,
      sections: t.teacherSubjects.length,
      students: t.tutorAssignments.length,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      deletedAt: t.deletedAt,
      createdBy: t.createdBy,
      updatedBy: t.updatedBy,
    }));
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        teacherSubjects: true,
        tutorAssignments: {
          where: { status: 'active' },
        },
      },
    });

    if (!teacher || teacher.deletedAt) return null;

    return {
      id: teacher.id,
      teacher_id: teacher.teacher_id,
      teacherCode: teacher.teacherCode,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone,
      status: teacher.status,
      userId: teacher.userId,
      email: teacher.user?.email ?? '',
      profileImage: teacher.user?.profileImage ?? null,
      sections: teacher.teacherSubjects.length,
      students: teacher.tutorAssignments.length,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      deletedAt: teacher.deletedAt,
      createdBy: teacher.createdBy,
      updatedBy: teacher.updatedBy,
    };
  }

  async update(id: string, data: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher || teacher.deletedAt) return null;

    if (teacher.userId) {
      await this.prisma.authUser.update({
        where: { id: teacher.userId },
        data: {
          first_name: data.firstName !== undefined ? data.firstName : undefined,
          last_name: data.lastName !== undefined ? data.lastName : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
          email: data.email !== undefined ? data.email : undefined,
          profileImage: data.profileImage !== undefined ? data.profileImage : undefined,
          is_active: data.status !== undefined ? data.status : undefined,
          status:
            data.status !== undefined
              ? data.status
                ? 'ACTIVE'
                : 'INACTIVE'
              : undefined,
        },
      });
    }

    const updated = await this.prisma.teacher.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        status: data.status !== undefined ? data.status : undefined,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        teacherSubjects: true,
        tutorAssignments: {
          where: { status: 'active' },
        },
      },
    });

    return {
      id: updated.id,
      teacher_id: updated.teacher_id,
      teacherCode: updated.teacherCode,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      status: updated.status,
      userId: updated.userId,
      email: updated.user?.email ?? '',
      profileImage: updated.user?.profileImage ?? null,
      sections: updated.teacherSubjects.length,
      students: updated.tutorAssignments.length,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      deletedAt: updated.deletedAt,
      createdBy: updated.createdBy,
      updatedBy: updated.updatedBy,
    };
  }

  async remove(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher || teacher.deletedAt) return null;

    const deleted = await this.prisma.teacher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    if (teacher.userId) {
      await this.prisma.authUser.update({
        where: { id: teacher.userId },
        data: {
          status: 'INACTIVE',
          is_active: false,
          deletedAt: new Date(),
        },
      });
    }

    return deleted;
  }
}
