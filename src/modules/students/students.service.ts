import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    if (data.studentCode) {
      const existingCode = await this.prisma.student.findFirst({
        where: { studentCode: data.studentCode, deletedAt: null },
      });
      if (existingCode) {
        throw new ConflictException({
          error: 'STUDENT_CODE_ALREADY_EXISTS',
          message: 'Student code already exists.',
        });
      }
    }

    if (data.email) {
      const existingEmail = await this.prisma.student.findFirst({
        where: { email: data.email, deletedAt: null },
      });
      if (existingEmail) {
        throw new ConflictException({
          error: 'STUDENT_EMAIL_ALREADY_EXISTS',
          message: 'Student email already exists.',
        });
      }
    }

    let genderEnum = undefined;
    if (data.gender) {
      const lowerGender = data.gender.toLowerCase();
      if (['male', 'female', 'other'].includes(lowerGender)) {
        genderEnum = lowerGender;
      }
    }

    let statusEnum = 'active';
    if (data.status) {
      const lowerStatus = data.status.toLowerCase();
      if (['active', 'suspended', 'graduated'].includes(lowerStatus)) {
        statusEnum = lowerStatus;
      }
    }

    let dobDate = undefined;
    if (data.dateOfBirth) {
      dobDate = new Date(data.dateOfBirth);
    }

    const student = await this.prisma.student.create({
      data: {
        studentCode: data.studentCode,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: genderEnum as any,
        dateOfBirth: dobDate,
        placeOfBirth: data.placeOfBirth,
        phone: data.phone,
        email: data.email,
        profileImage: data.profileImage,
        status: statusEnum as any,
        classId: data.classId,
      },
      include: { class: true },
    });

    if (student.email) {
      const authUser = await this.prisma.authUser.findUnique({
        where: { email: student.email },
      });
      if (authUser) {
        await this.prisma.authUser.update({
          where: { id: authUser.id },
          data: {
            first_name: student.firstName,
            last_name: student.lastName,
            phone: student.phone,
            profileImage: student.profileImage,
            entity_type: 'student',
          },
        });
      }
    }

    return {
      id: student.id,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      placeOfBirth: student.placeOfBirth,
      phone: student.phone,
      email: student.email,
      profileImage: student.profileImage,
      status: student.status,
      classId: student.classId,
      className: student.class?.name ?? null,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      deletedAt: student.deletedAt,
      createdBy: student.createdBy,
      updatedBy: student.updatedBy,
    };
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    let whereClause: any = { deletedAt: null };

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { studentCode: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ],
      };
    }

    const [rawStudents, total] = await Promise.all([
      this.prisma.student.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: { class: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where: whereClause }),
    ]);

    const data = rawStudents.map((s) => ({
      id: s.id,
      studentCode: s.studentCode,
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      placeOfBirth: s.placeOfBirth,
      phone: s.phone,
      email: s.email,
      profileImage: s.profileImage,
      status: s.status,
      classId: s.classId,
      className: s.class?.name ?? null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      deletedAt: s.deletedAt,
      createdBy: s.createdBy,
      updatedBy: s.updatedBy,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { class: true },
    });
    if (!student || student.deletedAt) {
      throw new NotFoundException({ error: 'STUDENT_NOT_FOUND', message: `Student with ID ${id} not found` });
    }
    return {
      id: student.id,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      placeOfBirth: student.placeOfBirth,
      phone: student.phone,
      email: student.email,
      profileImage: student.profileImage,
      status: student.status,
      classId: student.classId,
      className: student.class?.name ?? null,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      deletedAt: student.deletedAt,
      createdBy: student.createdBy,
      updatedBy: student.updatedBy,
    };
  }

  async update(id: string, data: any) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student || student.deletedAt) {
      throw new NotFoundException({ error: 'STUDENT_NOT_FOUND', message: `Student with ID ${id} not found` });
    }

    if (data.studentCode || data.email) {
      const existing = await this.prisma.student.findFirst({
        where: {
          OR: [
            data.studentCode ? { studentCode: data.studentCode } : undefined,
            data.email ? { email: data.email } : undefined,
          ].filter(Boolean) as any,
          NOT: { id },
          deletedAt: null,
        },
      });
      if (existing) {
        throw new ConflictException('Student code or email already exists');
      }
    }

    let statusEnum = undefined;
    if (data.status) {
      const lower = data.status.toLowerCase();
      if (['active', 'suspended', 'graduated'].includes(lower)) {
        statusEnum = lower;
      }
    }

    let dobDate = undefined;
    if (data.dateOfBirth) {
      dobDate = new Date(data.dateOfBirth);
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        placeOfBirth: data.placeOfBirth,
        dateOfBirth: dobDate,
        status: statusEnum as any,
        classId: data.classId,
        profileImage: data.profileImage,
        updatedAt: new Date(),
      },
      include: { class: true },
    });

    // Sync to authUser if email exists
    if (student.email) {
      const authUser = await this.prisma.authUser.findUnique({
        where: { email: student.email },
      });
      if (authUser) {
        await this.prisma.authUser.update({
          where: { id: authUser.id },
          data: {
            first_name: data.firstName !== undefined ? data.firstName : undefined,
            last_name: data.lastName !== undefined ? data.lastName : undefined,
            email: data.email !== undefined ? data.email : undefined,
            phone: data.phone !== undefined ? data.phone : undefined,
            profileImage: data.profileImage !== undefined ? data.profileImage : undefined,
          },
        });
      }
    }

    return {
      id: updated.id,
      studentCode: updated.studentCode,
      firstName: updated.firstName,
      lastName: updated.lastName,
      gender: updated.gender,
      dateOfBirth: updated.dateOfBirth,
      placeOfBirth: updated.placeOfBirth,
      phone: updated.phone,
      email: updated.email,
      profileImage: updated.profileImage,
      status: updated.status,
      classId: updated.classId,
      className: updated.class?.name ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      deletedAt: updated.deletedAt,
      createdBy: updated.createdBy,
      updatedBy: updated.updatedBy,
    };
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
