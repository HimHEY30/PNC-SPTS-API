import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: jest.Mocked<DashboardRepository>;

  const mockRepository = {
    getStudentsCount: jest.fn(),
    getStudentsUnderFollowUpCount: jest.fn(),
    getOpenCasesCount: jest.fn(),
    getResolvedCasesCount: jest.fn(),
    getRecentActivities: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DashboardRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    repository = module.get(DashboardRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTrend', () => {
    it('should return +100% when previous is 0 and current is greater than 0', () => {
      expect(service.calculateTrend(10, 0)).toBe('+100%');
    });

    it('should return 0% when both current and previous are 0', () => {
      expect(service.calculateTrend(0, 0)).toBe('0%');
    });

    it('should return positive trend formatted with plus sign', () => {
      expect(service.calculateTrend(112, 100)).toBe('+12%');
    });

    it('should return negative trend formatted with minus sign', () => {
      expect(service.calculateTrend(98, 100)).toBe('-2%');
    });

    it('should round to nearest integer', () => {
      expect(service.calculateTrend(112.4, 100)).toBe('+12%');
      expect(service.calculateTrend(112.6, 100)).toBe('+13%');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for dates within 1 minute', () => {
      const now = new Date();
      const justNow = new Date(now.getTime() - 30 * 1000);
      expect(service.formatRelativeTime(justNow, now)).toBe('just now');
    });

    it('should return correct minutes ago text', () => {
      const now = new Date();
      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
      expect(service.formatRelativeTime(tenMinsAgo, now)).toBe('10 minutes ago');
    });

    it('should handle singular minutes', () => {
      const now = new Date();
      const oneMinAgo = new Date(now.getTime() - 65 * 1000);
      expect(service.formatRelativeTime(oneMinAgo, now)).toBe('1 minute ago');
    });

    it('should return correct hours ago text', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(service.formatRelativeTime(twoHoursAgo, now)).toBe('2 hours ago');
    });

    it('should return correct days ago text', () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      expect(service.formatRelativeTime(fiveDaysAgo, now)).toBe('5 days ago');
    });

    it('should return correct months ago text for older dates', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 62 * 24 * 60 * 60 * 1000);
      expect(service.formatRelativeTime(twoMonthsAgo, now)).toBe('2 months ago');
    });
  });

  describe('getSummary', () => {
    it('should construct summary payload with formatted stats and recent activities', async () => {
      repository.getStudentsCount.mockResolvedValueOnce(1284); // current
      repository.getStudentsCount.mockResolvedValueOnce(1146); // previous
      
      repository.getStudentsUnderFollowUpCount.mockResolvedValueOnce(86);
      repository.getStudentsUnderFollowUpCount.mockResolvedValueOnce(83);

      repository.getOpenCasesCount.mockResolvedValueOnce(24);
      repository.getOpenCasesCount.mockResolvedValueOnce(25);

      repository.getResolvedCasesCount.mockResolvedValueOnce(112);
      repository.getResolvedCasesCount.mockResolvedValueOnce(95);

      const mockCreatedAt = new Date();
      repository.getRecentActivities.mockResolvedValueOnce([
        {
          id: 'case-1',
          title: 'Grade improvement in Web Dev',
          priority: 'low',
          createdAt: mockCreatedAt,
          student: { firstName: 'Vannak', lastName: 'Soy' },
          openedByTeacher: { firstName: 'Chantrea', lastName: 'Keo' },
          caseTypeMap: [
            {
              followUpType: { name: 'Academic' },
            },
          ],
        },
      ] as any);

      const result = await service.getSummary();

      expect(result.stats).toEqual([
        { label: 'Total Students', value: '1,284', trend: '+12%', color_key: 'blue' },
        { label: 'Students Under Follow-Up', value: '86', trend: '+4%', color_key: 'amber' },
        { label: 'Open Cases', value: '24', trend: '-4%', color_key: 'rose' },
        { label: 'Resolved Cases', value: '112', trend: '+18%', color_key: 'emerald' },
      ]);

      expect(result.recent_activity).toHaveLength(1);
      expect(result.recent_activity[0]).toEqual({
        id: 'case-1',
        teacher: 'Chantrea Keo',
        student: 'Vannak Soy',
        date: 'just now',
        subject: 'Grade improvement in Web Dev',
        type: 'Academic',
        priority: 'Low',
      });
    });
  });
});
