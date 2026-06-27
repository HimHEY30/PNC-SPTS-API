import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpRepository } from './follow-up.repository';
import { AssignFollowUpCaseDto } from './dto/assign-follow-up-case.dto';
import { CompleteFollowUpCaseDto } from './dto/complete-follow-up-case.dto';
import { CreateFollowUpCaseDto } from './dto/create-follow-up-case.dto';
import { CreateFollowUpReportDto } from './dto/create-follow-up-report.dto';
import { RejectFollowUpCaseDto } from './dto/reject-follow-up-case.dto';
import { FollowUpCase, FollowUpStatus } from '@prisma/client';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { FollowUpCaseEventBus } from './events/follow-up-case-event-bus.service';
import {
  CaseAcceptedEvent,
  CaseAssignedEvent,
  CaseCompletedEvent,
  CaseRejectedEvent,
} from './events/follow-up-case.events';

const BOARD_CACHE_KEY = 'board:cache';

@Injectable()
export class FollowUpService {
  constructor(
    private readonly repository: FollowUpRepository,
    private readonly redis: RedisService,
    private readonly eventBus: FollowUpCaseEventBus,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createCase(dto: CreateFollowUpCaseDto, actor: AuthenticatedUser): Promise<FollowUpCase> {
    // 1. Verify existence of foreign keys before calling repository
    const [student, teacher, term] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
      this.prisma.teacher.findUnique({ where: { id: dto.openedByTeacherId } }),
      this.prisma.term.findUnique({ where: { id: dto.termId } }),
    ]);
    console.log('\n--- NEW CODE IS RUNNING ---', dto); // ADD THIS

    if (!student) throw new NotFoundException(`Student with ID ${dto.studentId} not found.`);
    if (!teacher) throw new NotFoundException(`Teacher with ID ${dto.openedByTeacherId} not found.`);
    if (!term) throw new NotFoundException(`Term with ID ${dto.termId} not found.`);

    // 2. Proceed only after validation passes
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
    return this.prepareFollowUpCaseResponse(newCase);
  }

  async getBoardData() {
    // Try Redis cache first — fail silently if Redis is unavailable
    try {
      const cached = await this.redis.get<any>(BOARD_CACHE_KEY);
      if (cached) return cached;
    } catch {
      // Redis unavailable — skip cache, hit DB directly
    }

    const cases = (await this.repository.findBoardData()).map((record) =>
      this.prepareFollowUpCaseResponse(record),
    );
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
    return this.prepareFollowUpCaseResponse(updated);
  }

  async findAll(page: number, limit: number): Promise<any[]> {
    const skip = (page - 1) * limit;
    const records = await this.repository.findAll(skip, limit);
    return records.map((record) => this.prepareFollowUpCaseResponse(record));
  }

  async findOne(id: string): Promise<any> {
    const record = await this.repository.findOne(id);
    if (!record) {
      throw new NotFoundException({
        error: 'CASE_NOT_FOUND',
        message: 'The requested case does not exist or has been deleted.',
      });
    }
    return this.prepareFollowUpCaseResponse(record);
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
    return this.prepareFollowUpCaseResponse(updated);
  }

  async removeCase(id: string): Promise<FollowUpCase> {
    await this.findOne(id); // Throws NotFound if not exist
    const deleted = await this.repository.removeCase(id);
    await this.invalidateCache();
    return deleted;
  }

  async assignCase(caseId: string, dto: AssignFollowUpCaseDto, actor: AuthenticatedUser) {
    this.ensureCanAssign(actor);

    const followUpCase = await this.getAssignmentCaseOrThrow(caseId);
    const assignedUser = await this.repository.findAssignableUser(dto.teacherId);
    if (!assignedUser || !this.hasAnyRole(this.getRoleNames(assignedUser), ['TEACHER', 'TUTOR'])) {
      throw new BadRequestException({
        error: 'INVALID_ASSIGNEE',
        message: 'The assigned user must exist and have TEACHER or TUTOR role.',
      });
    }

    const actorUser = await this.repository.findActorById(actor.user_id);
    const result = await this.repository.assignCase(caseId, actor.user_id, assignedUser.id);

    await this.invalidateCache();
    await this.eventBus.publish(
      new CaseAssignedEvent(
        this.buildAssignmentEventPayload({
          assignment: result.assignment,
          actorUser,
          actorFallback: actor,
          previousStatus: result.previousAssignment?.status ?? null,
          newStatus: result.assignment.status,
          followUpCase,
        }),
      ),
    );

    return this.prepareAssignmentResponse(result.assignment);
  }

  async acceptCase(caseId: string, actor: AuthenticatedUser) {
    const assignment = await this.getActiveAssignmentForActor(caseId, actor);
    const previousStatus = assignment.status;

    const updated = await this.repository.updateAssignmentStatus(assignment.id, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    });

    await this.invalidateCache();
    await this.eventBus.publish(
      new CaseAcceptedEvent(
        this.buildAssignmentEventPayload({
          assignment: updated,
          actorUser: await this.repository.findActorById(actor.user_id),
          actorFallback: actor,
          previousStatus,
          newStatus: updated.status,
        }),
      ),
    );

    return this.prepareAssignmentResponse(updated);
  }

  async rejectCase(caseId: string, dto: RejectFollowUpCaseDto, actor: AuthenticatedUser) {
    const assignment = await this.getActiveAssignmentForActor(caseId, actor);
    const previousStatus = assignment.status;

    const updated = await this.repository.updateAssignmentStatus(assignment.id, {
      status: 'REJECTED',
      remarks: dto.reason,
    });

    await this.invalidateCache();
    await this.eventBus.publish(
      new CaseRejectedEvent(
        this.buildAssignmentEventPayload({
          assignment: updated,
          actorUser: await this.repository.findActorById(actor.user_id),
          actorFallback: actor,
          previousStatus,
          newStatus: updated.status,
          remarks: dto.reason,
        }),
      ),
    );

    return this.prepareAssignmentResponse(updated);
  }

  async completeCase(caseId: string, dto: CompleteFollowUpCaseDto, actor: AuthenticatedUser) {
    const assignment = await this.getActiveAssignmentForActor(caseId, actor);
    const previousStatus = assignment.status;

    const updated = await this.repository.updateAssignmentStatus(assignment.id, {
      status: 'COMPLETED',
      completedAt: new Date(),
      remarks: dto.summary,
    });

    await this.invalidateCache();
    await this.eventBus.publish(
      new CaseCompletedEvent(
        this.buildAssignmentEventPayload({
          assignment: updated,
          actorUser: await this.repository.findActorById(actor.user_id),
          actorFallback: actor,
          previousStatus,
          newStatus: updated.status,
          remarks: dto.summary,
        }),
      ),
    );

    return this.prepareAssignmentResponse(updated);
  }

  // ── Attachments ──────────────────────────────────────────────────────────────

  async createReport(
    caseId: string,
    dto: CreateFollowUpReportDto,
    files: Express.Multer.File[] = [],
  ) {
    await this.findOne(caseId);

    const report = await this.repository.createReport({
      followUpCaseId: caseId,
      teacherId: dto.teacherId,
      reportDate: dto.reportDate ? new Date(dto.reportDate) : undefined,
      progressStatus: dto.progressStatus,
      observation: dto.observation,
      nextAction: dto.nextAction,
    });

    const attachments = [];
    for (const file of files) {
      attachments.push(await this.addAttachment(report.id, file));
    }

    await this.invalidateCache();

    return this.prepareReportResponse({
      ...report,
      attachments,
    });
  }

  async addAttachment(reportId: string, file: Express.Multer.File) {
    const report = await this.repository.findReportById(reportId);
    if (!report || report.followUpCase?.deletedAt) {
      throw new NotFoundException({
        error: 'REPORT_NOT_FOUND',
        message: 'The follow-up report does not exist.',
      });
    }

    const attachment = await this.repository.createAttachment({
      reportId,
      fileName: file.originalname,
      filePath: `/uploads/follow-up-attachments/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      storageProvider: 'local',
    });

    await this.invalidateCache();

    return this.prepareAttachmentResponse(attachment);
  }

  async getAttachments(reportId: string) {
    const report = await this.repository.findReportById(reportId);
    if (!report || report.followUpCase?.deletedAt) {
      throw new NotFoundException({
        error: 'REPORT_NOT_FOUND',
        message: 'The follow-up report does not exist.',
      });
    }

    const attachments = await this.repository.findAttachmentsByReportId(reportId);
    return attachments.map((attachment) => this.prepareAttachmentResponse(attachment));
  }

  private async invalidateCache() {
    try {
      await this.redis.del(BOARD_CACHE_KEY);
    } catch {
      // Redis unavailable — skip invalidation
    }
  }

  private prepareFollowUpCaseResponse(record: any) {
    if (!record) return record;

    return {
      ...record,
      reports: record.reports?.map((report) => this.prepareReportResponse(report)) ?? record.reports,
    };
  }

  private prepareReportResponse(report: any) {
    if (!report) return report;

    return {
      ...report,
      attachments:
        report.attachments?.map((attachment) => this.prepareAttachmentResponse(attachment)) ??
        report.attachments,
    };
  }

  private prepareAttachmentResponse(attachment: any) {
    if (!attachment) return attachment;

    const baseUrl = this.config.get<string>('APP_BASE_URL') ?? 'http://localhost:3000';
    const url = `${baseUrl.replace(/\/$/, '')}${attachment.filePath}`;

    return {
      ...attachment,
      url,
    };
  }

  private ensureCanAssign(actor: AuthenticatedUser) {
    if (!this.isPrivileged(actor)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Only administrators and education managers can assign follow-up cases.',
      });
    }
  }

  private async getAssignmentCaseOrThrow(caseId: string) {
    const followUpCase = await this.repository.findAssignmentCaseById(caseId);
    if (!followUpCase) {
      throw new NotFoundException({
        error: 'CASE_NOT_FOUND',
        message: 'The requested case does not exist or has been deleted.',
      });
    }
    return followUpCase;
  }

  private async getActiveAssignmentForActor(caseId: string, actor: AuthenticatedUser) {
    await this.getAssignmentCaseOrThrow(caseId);

    const assignment = await this.repository.findActiveAssignmentForCase(caseId);
    if (!assignment) {
      throw new NotFoundException({
        error: 'ASSIGNMENT_NOT_FOUND',
        message: 'This follow-up case has no active assignment.',
      });
    }

    const isAssignedUser = assignment.assignedToUserId === actor.user_id;
    if (!isAssignedUser && !this.isPrivileged(actor)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Only the assigned teacher/tutor can update this assignment.',
      });
    }

    return assignment;
  }

  private buildAssignmentEventPayload(options: {
    assignment: any;
    actorUser: any;
    actorFallback: AuthenticatedUser;
    previousStatus?: string | null;
    newStatus: string;
    remarks?: string | null;
    followUpCase?: any;
  }) {
    const followUpCase = options.followUpCase ?? options.assignment.followUpCase;

    return {
      caseId: options.assignment.caseId,
      assignmentId: options.assignment.id,
      actor: this.toEventUser(options.actorUser, options.actorFallback.user_id),
      assignedBy: this.toEventUser(options.assignment.assignedBy, options.assignment.assignedByUserId),
      assignedTo: this.toEventUser(options.assignment.assignedTo, options.assignment.assignedToUserId),
      case: {
        id: followUpCase.id,
        title: followUpCase.title,
        priority: followUpCase.priority,
        studentName: this.fullName(followUpCase.student?.firstName, followUpCase.student?.lastName),
        followUpType:
          followUpCase.caseTypeMap?.map((item) => item.followUpType?.name).filter(Boolean).join(', ') ||
          'N/A',
        dueDate: followUpCase.term?.endDate,
      },
      previousStatus: options.previousStatus,
      newStatus: options.newStatus,
      remarks: options.remarks,
    };
  }

  private prepareAssignmentResponse(assignment: any) {
    return {
      ...assignment,
      assignedBy: assignment.assignedBy
        ? {
            id: assignment.assignedBy.id,
            email: assignment.assignedBy.email,
            name: this.fullName(assignment.assignedBy.first_name, assignment.assignedBy.last_name),
          }
        : assignment.assignedBy,
      assignedTo: assignment.assignedTo
        ? {
            id: assignment.assignedTo.id,
            email: assignment.assignedTo.email,
            name: this.fullName(assignment.assignedTo.first_name, assignment.assignedTo.last_name),
          }
        : assignment.assignedTo,
    };
  }

  private isPrivileged(actor: AuthenticatedUser) {
    return this.hasAnyRole(actor.roles, [
      'SUPER_ADMIN',
      'ADMIN',
      'ACADEMIC_MANAGER',
      'EDUCATION_MANAGER',
    ]);
  }

  private hasAnyRole(userRoles: string[], requiredRoles: string[]) {
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  private getRoleNames(user: any): string[] {
    return user.roles?.map((userRole) => userRole.role?.name).filter(Boolean) ?? [];
  }

  private toEventUser(user: any, fallbackId: string) {
    return {
      id: user?.id ?? fallbackId,
      email: user?.email,
      name: this.fullName(user?.first_name, user?.last_name),
    };
  }

  private fullName(firstName?: string, lastName?: string): string | undefined {
    return [firstName, lastName].filter(Boolean).join(' ') || undefined;
  }
}