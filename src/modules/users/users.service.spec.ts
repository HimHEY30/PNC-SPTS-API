jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let moduleRef: TestingModule;
  const mockPrisma = {
    authUser: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = moduleRef.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return a user profile mapped to the expected JSON schema', async () => {
      const mockUser = {
        id: 'user-id-123',
        first_name: 'Chandy',
        last_name: 'Neat',
        email: 'chandyneat9999@gmail.com',
        phone: '+85512345678',
        profileImage: 'https://example.com/avatar.jpg',
        entity_type: 'admin',
        status: 'ACTIVE',
        is_active: true,
        roles: [{ role: { name: 'ADMIN' } }],
        twitter_url: 'https://twitter.com/chandyneat',
        facebook_url: null,
        linkedin_url: 'https://linkedin.com/in/chandyneat',
        pinterest_url: null,
        activities: [
          {
            id: 'act-1',
            eventDate: new Date(),
            actionTitle: 'Meeting with client',
            targetName: 'Spotify redesign',
            targetUrl: 'https://spotify.example.com',
            categoryType: 'Achievement',
            priority: 'High',
          },
        ],
        tasks: [
          {
            id: 'task-1',
            title: 'Implement profile view',
            isCompleted: false,
            completedSubtasksCount: 5,
            totalSubtasksCount: 19,
            commentsCount: 3,
            collaborators: [
              {
                id: 'user-id-123',
                first_name: 'Chandy',
                last_name: 'Neat',
                profileImage: 'https://example.com/avatar.jpg',
              },
            ],
          },
        ],
        sharedAssets: [
          {
            id: 'file-1',
            filename: 'IOtask web UI kit.sketch',
            categoryTag: 'Design',
            storageUrl: 'https://storage.example.com/assets/iotask_kit.sketch',
            createdAt: new Date(),
            users: [{ id: 'user-id-123' }, { id: 'other-user' }],
          },
        ],
      };

      mockPrisma.authUser.findUnique.mockResolvedValueOnce(mockUser);

      const profile = await service.getUserProfile('user-id-123');

      expect(profile).toEqual({
        id: 'user-id-123',
        first_name: 'Chandy',
        last_name: 'Neat',
        email: 'chandyneat9999@gmail.com',
        phone: '+85512345678',
        profile_image: 'https://example.com/avatar.jpg',
        entity_type: 'admin',
        status: 'ACTIVE',
        is_active: true,
        roles: ['ADMIN'],
        social_links: {
          twitter: 'https://twitter.com/chandyneat',
          facebook: null,
          linkedin: 'https://linkedin.com/in/chandyneat',
          pinterest: null,
        },
        recent_activities: [
          {
            id: 'act-1',
            event_date: mockUser.activities[0].eventDate,
            action_title: 'Meeting with client',
            target_name: 'Spotify redesign',
            target_url: 'https://spotify.example.com',
            category_type: 'Achievement',
            priority: 'High',
          },
        ],
        assigned_tasks: [
          {
            id: 'task-1',
            title: 'Implement profile view',
            is_completed: false,
            completed_subtasks_count: 5,
            total_subtasks_count: 19,
            comments_count: 3,
            collaborators: [
              {
                id: 'user-id-123',
                first_name: 'Chandy',
                last_name: 'Neat',
                profile_image: 'https://example.com/avatar.jpg',
              },
            ],
          },
        ],
        uploaded_files: [
          {
            id: 'file-1',
            filename: 'IOtask web UI kit.sketch',
            category_tag: 'Design',
            storage_url: 'https://storage.example.com/assets/iotask_kit.sketch',
            created_at: mockUser.sharedAssets[0].createdAt,
            shared_count: 2,
          },
        ],
      });
    });
  });
});
