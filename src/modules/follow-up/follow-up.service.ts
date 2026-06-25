import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FollowUpRepository } from './follow-up.repository';
import { CreateFollowUpCaseDto } from './dto/create-follow-up-case.dto';
import { FollowUpCase, FollowUpStatus } from '@prisma/client';
import { RedisService } from '../../redis/redis.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

const BOARD_CACHE_KEY = 'board:cache';

@Injectable()
export class FollowUpService {
  constructor(
    private readonly repository: FollowUpRepository,
    private readonly redis: RedisService,
  ) {}

  async createCase(dto: CreateFollowUpCaseDto, actor: AuthenticatedUser): Promise<FollowUpCase> {
    const data = {
      studentId: dto.studentId,
      openedByTeacherId: dto.openedByTeacherId,
      termId: dto.termId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: dto.status,
      createdBy: actor.user_id,
    };
    const newCase = await this.repository.createCase(data);
    await this.invalidateCache();
    return newCase;
  }

  async getBoardData() {
    // Try Redis cache first — fail silently if Redis is unavailable
    try {
      const cached = await this.redis.get<any>(BOARD_CACHE_KEY);
      if (cached) return cached;
    } catch {
      // Redis unavailable — skip cache, hit DB directly
    }

    const cases = await this.repository.findBoardData();
    const grouped = {
      OPEN: cases.filter((c) => c.status === FollowUpStatus.OPEN),
      IN_PROGRESS: cases.filter((c) => c.status === FollowUpStatus.IN_PROGRESS),
      RESOLVED: cases.filter((c) => c.status === FollowUpStatus.RESOLVED),
      CLOSED: cases.filter((c) => c.status === FollowUpStatus.CLOSED),
    };

    // Cache with TTL of 5 minutes — fail silently if Redis is unavailable
    try {
      await this.redis.set(BOARD_CACHE_KEY, grouped, 300);
    } catch {
      // Redis unavailable — skip caching
    }

    return grouped;
  }

  async moveCase(
    id: string,
    newStatus: FollowUpStatus,
    actor: AuthenticatedUser,
  ): Promise<FollowUpCase> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException({
        error: 'CASE_NOT_FOUND',
        message: 'The requested case does not exist or has been deleted.',
      });
    }

    // Status transition rules: Disallow moving a CLOSED case unless user is ADMIN or SUPER_ADMIN
    if (existing.status === FollowUpStatus.CLOSED) {
      const isAdmin = actor.roles.includes('ADMIN') || actor.roles.includes('SUPER_ADMIN');
      if (!isAdmin) {
        throw new BadRequestException({
          error: 'BAD_REQUEST',
          message: 'Only administrators can reopen a closed follow-up case.',
        });
      }
    }

    const updated = await this.repository.updateCase(id, {
      status: newStatus,
      updatedBy: actor.user_id,
    });

    await this.invalidateCache();
    return updated;
  }

  async findAll(page: number, limit: number): Promise<FollowUpCase[]> {
    const skip = (page - 1) * limit;
    return this.repository.findAll(skip, limit);
  }

  async findOne(id: string): Promise<FollowUpCase | null> {
    const record = await this.repository.findOne(id);
    if (!record) {
      throw new NotFoundException({
        error: 'CASE_NOT_FOUND',
        message: 'The requested case does not exist or has been deleted.',
      });
    }
    return record;
  }

  async updateCase(
    id: string,
    dto: Partial<CreateFollowUpCaseDto>,
    actor: AuthenticatedUser,
  ): Promise<FollowUpCase> {
    await this.findOne(id); // Throws NotFound if not exist
    const updated = await this.repository.updateCase(id, {
      ...dto,
      updatedBy: actor.user_id,
    });
    await this.invalidateCache();
    return updated;
  }

  async removeCase(id: string): Promise<FollowUpCase> {
    await this.findOne(id); // Throws NotFound if not exist
    const deleted = await this.repository.removeCase(id);
    await this.invalidateCache();
    return deleted;
  }

  private async invalidateCache() {
    try {
      await this.redis.del(BOARD_CACHE_KEY);
    } catch {
      // Redis unavailable — skip invalidation
    }
  }
}
