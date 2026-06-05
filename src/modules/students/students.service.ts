import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { StudentsRepository } from './students.repository';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentStatus } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly studentsRepository: StudentsRepository) {}

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
        ]
      };
    }

    const [data, total] = await Promise.all([
      this.studentsRepository.findAll({ skip, take: limit, where: whereClause }),
      this.studentsRepository.count(whereClause)
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total
      }
    };
  }

  async findOne(id: string) {
    const student = await this.studentsRepository.findFirst({ id, deletedAt: null });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async create(createStudentDto: CreateStudentDto) {
    // Check for existing studentCode or email
    const existing = await this.studentsRepository.findFirst({
      OR: [
        { studentCode: createStudentDto.studentCode },
        { email: createStudentDto.email || 'NO_MATCH' }
      ],
      deletedAt: null
    });

    if (existing) {
      throw new ConflictException('Student code or email already exists');
    }

    // Convert date string if provided
    let dateOfBirth: Date | undefined;
    if (createStudentDto.dateOfBirth) {
      dateOfBirth = new Date(createStudentDto.dateOfBirth);
    }

    return this.studentsRepository.create({
      ...createStudentDto,
      dateOfBirth,
    });
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    await this.findOne(id); // Ensure exists

    if (updateStudentDto.studentCode || updateStudentDto.email) {
      const existing = await this.studentsRepository.findFirst({
        OR: [
          { studentCode: updateStudentDto.studentCode || 'NO_MATCH' },
          { email: updateStudentDto.email || 'NO_MATCH' }
        ],
        NOT: { id },
        deletedAt: null
      });

      if (existing) {
        throw new ConflictException('Student code or email already exists');
      }
    }

    let dateOfBirth: Date | undefined;
    if (updateStudentDto.dateOfBirth) {
      dateOfBirth = new Date(updateStudentDto.dateOfBirth);
    }

    return this.studentsRepository.update({ id }, { ...updateStudentDto, dateOfBirth });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    return this.studentsRepository.softDelete({ id });
  }
}
