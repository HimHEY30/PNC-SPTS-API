import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  private transformTeacher(teacher: any) {
    return {
      id: teacher.id,
      teacherCode: teacher.teacherCode,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone,
      status: teacher.status,
      userId: teacher.userId,
      email: teacher.user?.email ?? '',
      profileImage: teacher.user?.profileImage ?? null,
      sections: teacher.teacherSubjects?.length ?? 0,
      students: teacher.tutorAssignments?.length ?? 0,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      deletedAt: teacher.deletedAt,
      createdBy: teacher.createdBy,
      updatedBy: teacher.updatedBy,
    };
  }

  async create(dto: CreateTeacherDto) {
    // 1. Check if teacher code already exists
    const existingCode = await this.prisma.teacher.findFirst({
      where: { teacherCode: dto.teacherCode, deletedAt: null },
    });
    if (existingCode) {
      throw new ConflictException({
        error: 'TEACHER_CODE_ALREADY_EXISTS',
        message: 'Teacher code already exists.',
      });
    }

    // 2. Resolve or create AuthUser
    let authUser = await this.prisma.authUser.findUnique({
      where: { email: dto.email },
    });

    if (authUser) {
      const existingTeacher = await this.prisma.teacher.findUnique({
        where: { userId: authUser.id },
      });
      if (existingTeacher && !existingTeacher.deletedAt) {
        throw new ConflictException({
          error: 'USER_ALREADY_HAS_TEACHER_PROFILE',
          message: 'This user email is already registered as a teacher.',
        });
      }
      // Update profile image if provided
      if (dto.profileImage) {
        authUser = await this.prisma.authUser.update({
          where: { id: authUser.id },
          data: { profileImage: dto.profileImage },
        });
      }
    } else {
      const role = await this.prisma.role.findUnique({
        where: { name: 'TUTOR' },
      });
      const passwordHash = await bcrypt.hash('Password123!', 12);
      authUser = await this.prisma.authUser.create({
        data: {
          email: dto.email,
          password_hash: passwordHash,
          entity_type: 'teacher',
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone: dto.phone,
          profileImage: dto.profileImage,
          is_active: dto.status !== false,
          status: dto.status !== false ? 'ACTIVE' : 'INACTIVE',
          roles: role
            ? { create: { role: { connect: { id: role.id } } } }
            : undefined,
        },
      });
    }

    // 3. Create Teacher profile
    const teacher = await this.prisma.teacher.create({
      data: {
        teacherCode: dto.teacherCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: dto.status !== false,
        userId: authUser.id,
        createdBy: dto.createdBy,
      },
      include: {
        user: true,
        teacherSubjects: true,
        tutorAssignments: { where: { status: 'active' } },
      },
    });

    return this.transformTeacher(teacher);
  }

  async findAll() {
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
        teacherSubjects: true,
        tutorAssignments: { where: { status: 'active' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return teachers.map((t) => this.transformTeacher(t));
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        teacherSubjects: true,
        tutorAssignments: { where: { status: 'active' } },
      },
    });
    if (!teacher || teacher.deletedAt) return null;
    return this.transformTeacher(teacher);
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!teacher || teacher.deletedAt) return null;

    // 1. Update associated AuthUser
    if (teacher.userId) {
      await this.prisma.authUser.update({
        where: { id: teacher.userId },
        data: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          profileImage: dto.profileImage,
          is_active: dto.status,
          status:
            dto.status !== undefined
              ? dto.status
                ? 'ACTIVE'
                : 'INACTIVE'
              : undefined,
        },
      });
    }

    // 2. Update Teacher profile
    const updated = await this.prisma.teacher.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: dto.status,
        updatedBy: dto.updatedBy,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        teacherSubjects: true,
        tutorAssignments: { where: { status: 'active' } },
      },
    });

    return this.transformTeacher(updated);
  }

  async remove(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher || teacher.deletedAt) return null;

    const deleted = await this.prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
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
