import { Test, TestingModule } from '@nestjs/testing';
import { FollowUpService } from './follow-up.service';
import { FollowUpRepository } from './follow-up.repository';
import { CreateFollowUpCaseDto } from './dto/create-follow-up-case.dto';
import { FollowUpCase } from '@prisma/client';

describe('FollowUpService', () => {
  let service: FollowUpService;
  let repository: Partial<FollowUpRepository>;

  beforeEach(async () => {
    repository = {
      createCase: jest.fn().mockImplementation((data) => Promise.resolve({ id: '1', ...data } as FollowUpCase)),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      updateCase: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data } as FollowUpCase)),
      removeCase: jest.fn().mockImplementation((id) => Promise.resolve({ id } as FollowUpCase)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowUpService, { provide: FollowUpRepository, useValue: repository }],
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
      openedDate: undefined,
    };
    const result = await service.createCase(dto);
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
    await service.updateCase('1', dto);
    expect(repository.updateCase).toHaveBeenCalledWith('1', expect.objectContaining({ title: 'Updated' }));
  });

  it('should remove a case', async () => {
    await service.removeCase('1');
    expect(repository.removeCase).toHaveBeenCalledWith('1');
  });
});
