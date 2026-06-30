import { Test, TestingModule } from '@nestjs/testing';
import { FollowUpService } from './follow-up.service';
import { FollowUpRepository } from './follow-up.repository';
import { CreateFollowUpCaseDto } from './dto/create-follow-up-case.dto';
import { FollowUpCase } from '@prisma/client';
import { RedisService } from '../../redis/redis.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { FollowUpCaseEventBus } from './events/follow-up-case-event-bus.service';

describe('FollowUpService', () => {
  let service: FollowUpService;
  let repository: Partial<FollowUpRepository>;
  let redis: Partial<RedisService>;
  let eventBus: Partial<FollowUpCaseEventBus>;

  const mockActor: AuthenticatedUser = {
    user_id: 'actor1',
    entity_type: 'teacher',
    roles: ['TEACHER'],
  };

  beforeEach(async () => {
    repository = {
      createCase: jest.fn().mockImplementation((data) => Promise.resolve({ id: '1', ...data } as FollowUpCase)),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockImplementation((id) => Promise.resolve({ id, status: 'OPEN', createdBy: 'actor1', openedByTeacher: { userId: 'actor1' } } as any)),
      updateCase: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data } as FollowUpCase)),
      removeCase: jest.fn().mockImplementation((id) => Promise.resolve({ id } as FollowUpCase)),
      createReport: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'report1',
          ...data,
          attachments: [],
        } as any),
      ),
      findReportById: jest.fn().mockResolvedValue({
        id: 'report1',
        followUpCase: { id: '1', deletedAt: null },
      } as any),
      createAttachment: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'attachment1',
          ...data,
          uploadedAt: new Date('2026-06-26T00:00:00.000Z'),
        } as any),
      ),
      findAttachmentsByReportId: jest.fn().mockResolvedValue([
        {
          id: 'attachment1',
          reportId: 'report1',
          fileName: 'note.pdf',
          filePath: '/uploads/follow-up-attachments/note.pdf',
          fileType: 'application/pdf',
          fileSize: 123,
          storageProvider: 'local',
          uploadedAt: new Date('2026-06-26T00:00:00.000Z'),
        },
      ] as any),
      findAssignmentCaseById: jest.fn().mockResolvedValue({
        id: '1',
        title: 'Attendance follow-up',
        priority: 'high',
        student: { firstName: 'Sophea', lastName: 'Chan' },
        term: { endDate: new Date('2026-07-01T00:00:00.000Z') },
        caseTypeMap: [{ followUpType: { name: 'Academic' } }],
      } as any),
      findAssignableUser: jest.fn().mockResolvedValue({
        id: 'teacherUser1',
        email: 'teacher@example.com',
        first_name: 'Teacher',
        last_name: 'One',
        roles: [{ role: { name: 'TUTOR' } }],
      } as any),
      findActorById: jest.fn().mockResolvedValue({
        id: 'admin1',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        roles: [{ role: { name: 'ADMIN' } }],
      } as any),
      assignCase: jest.fn().mockResolvedValue({
        assignment: {
          id: 'assignment1',
          caseId: '1',
          assignedByUserId: 'admin1',
          assignedToUserId: 'teacherUser1',
          status: 'PENDING',
          assignedBy: {
            id: 'admin1',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
          },
          assignedTo: {
            id: 'teacherUser1',
            email: 'teacher@example.com',
            first_name: 'Teacher',
            last_name: 'One',
          },
          followUpCase: {
            id: '1',
            title: 'Attendance follow-up',
            priority: 'high',
            student: { firstName: 'Sophea', lastName: 'Chan' },
            term: { endDate: new Date('2026-07-01T00:00:00.000Z') },
            caseTypeMap: [{ followUpType: { name: 'Academic' } }],
          },
        },
        previousAssignment: null,
      } as any),
      findActiveAssignmentForCase: jest.fn().mockResolvedValue({
        id: 'assignment1',
        caseId: '1',
        assignedByUserId: 'admin1',
        assignedToUserId: 'teacherUser1',
        status: 'PENDING',
      } as any),
      updateAssignmentStatus: jest.fn().mockImplementation((_id, data) =>
        Promise.resolve({
          id: 'assignment1',
          caseId: '1',
          assignedByUserId: 'admin1',
          assignedToUserId: 'teacherUser1',
          ...data,
          assignedBy: {
            id: 'admin1',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
          },
          assignedTo: {
            id: 'teacherUser1',
            email: 'teacher@example.com',
            first_name: 'Teacher',
            last_name: 'One',
          },
          followUpCase: {
            id: '1',
            title: 'Attendance follow-up',
            priority: 'high',
            student: { firstName: 'Sophea', lastName: 'Chan' },
            term: { endDate: new Date('2026-07-01T00:00:00.000Z') },
            caseTypeMap: [{ followUpType: { name: 'Academic' } }],
          },
        } as any),
      ),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpService,
        { provide: FollowUpRepository, useValue: repository },
        { provide: RedisService, useValue: redis },
        { provide: FollowUpCaseEventBus, useValue: eventBus },
      ],
    }).compile();

    service = module.get<FollowUpService>(FollowUpService);
  });

  it('should create a follow-up case', async () => {
    const dto: CreateFollowUpCaseDto = {
      studentId: 'stu1',
      openedByTeacherId: 'teach1',
      termId: 'term1',
      title: 'Test case',
      description: 'desc',
      priority: 'LOW' as any,
      status : 'OPEN' as any,
    };
    const result = await service.createCase(dto, mockActor);
    expect(repository.createCase).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'stu1' }));
    expect(result).toHaveProperty('id');
  });

  it('should find all with pagination', async () => {
    await service.findAll(2, 10);
    expect(repository.findAll).toHaveBeenCalledWith(10, 10);
  });

  it('should find one by id', async () => {
    await service.findOne('1');
    expect(repository.findOne).toHaveBeenCalledWith('1');
  });

  it('should update a case', async () => {
    const dto = { title: 'Updated' };
    await service.updateCase('1', dto, mockActor);
    expect(repository.updateCase).toHaveBeenCalledWith('1', expect.objectContaining({ title: 'Updated' }));
  });

  it('should remove a case', async () => {
    await service.removeCase('1');
    expect(repository.removeCase).toHaveBeenCalledWith('1');
  });

  it('should create a report with attachments and prepare file urls', async () => {
    const file = {
      originalname: 'note.pdf',
      filename: 'saved-note.pdf',
      mimetype: 'application/pdf',
      size: 123,
    } as Express.Multer.File;

    const result = await service.createReport(
      '1',
      {
        teacherId: 'teach1',
        progressStatus: 'Improving',
      },
      [file],
    );

    expect(repository.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        followUpCaseId: '1',
        teacherId: 'teach1',
        progressStatus: 'Improving',
      }),
    );
    expect(repository.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: 'report1',
        fileName: 'note.pdf',
        filePath: '/uploads/follow-up-attachments/saved-note.pdf',
      }),
    );
    expect(result.attachments[0]).toMatchObject({
      fileName: 'note.pdf',
      url: '/uploads/follow-up-attachments/saved-note.pdf',
    });
  });

  it('should list attachments with prepared file urls', async () => {
    const result = await service.getAttachments('report1');

    expect(repository.findAttachmentsByReportId).toHaveBeenCalledWith('report1');
    expect(result[0]).toMatchObject({
      fileName: 'note.pdf',
      url: '/uploads/follow-up-attachments/note.pdf',
    });
  });

  it('should assign a case to a teacher or tutor and publish an event', async () => {
    const result = await service.assignCase(
      '1',
      { teacherId: 'teacherUser1' },
      { user_id: 'admin1', entity_type: 'admin', roles: ['ADMIN'] },
    );

    expect(repository.assignCase).toHaveBeenCalledWith('1', 'admin1', 'teacherUser1');
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CaseAssignedEvent',
      }),
    );
    expect(result).toMatchObject({
      id: 'assignment1',
      status: 'PENDING',
      assignedTo: { name: 'Teacher One' },
    });
  });

  it('should accept an assigned case and publish an event', async () => {
    const result = await service.acceptCase('1', {
      user_id: 'teacherUser1',
      entity_type: 'teacher',
      roles: ['TUTOR'],
    });

    expect(repository.updateAssignmentStatus).toHaveBeenCalledWith(
      'assignment1',
      expect.objectContaining({
        status: 'ACCEPTED',
      }),
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CaseAcceptedEvent',
      }),
    );
    expect(result.status).toBe('ACCEPTED');
  });
});
