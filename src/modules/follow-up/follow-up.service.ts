import { Injectable } from '@nestjs/common';
import { FollowUpRepository } from './follow-up.repository';
import { CreateFollowUpCaseDto } from './dto/create-follow-up-case.dto';
import { FollowUpCase } from '@prisma/client';

@Injectable()
export class FollowUpService {
  constructor(private readonly repository: FollowUpRepository) {}

  async createCase(dto: CreateFollowUpCaseDto): Promise<FollowUpCase> {
    // Map DTO fields directly; adjust as needed
    const data: Partial<FollowUpCase> = {
      studentId: dto.studentId,
      openedByTeacherId: dto.openedByTeacherId,
      termId: dto.termId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: dto.status,
    } as any;
    return this.repository.createCase(data);
  }

  async findAll(page: number, limit: number): Promise<FollowUpCase[]> {
    const skip = (page - 1) * limit;
    return this.repository.findAll(skip, limit);
  }

  async findOne(id: string): Promise<FollowUpCase | null> {
    return this.repository.findOne(id);
  }

  async updateCase(id: string, dto: Partial<CreateFollowUpCaseDto>): Promise<FollowUpCase> {
    const data: Partial<FollowUpCase> = { ...dto } as any;
    return this.repository.updateCase(id, data);
  }

  async removeCase(id: string): Promise<FollowUpCase> {
    return this.repository.removeCase(id);
  }
}
