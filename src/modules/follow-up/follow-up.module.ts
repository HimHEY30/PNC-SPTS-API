import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FollowUpCaseAssignmentController } from './follow-up-case-assignment.controller';
import { FollowUpController } from './follow-up.controller';
import { FollowUpService } from './follow-up.service';
import { FollowUpRepository } from './follow-up.repository';
import { PrismaService } from '../../database/prisma.service';
import { RedisModule } from '../../redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { FollowUpCaseEventBus } from './events/follow-up-case-event-bus.service';
import { AuditLogHandler } from './handlers/audit-log.handler';
import { EmailNotificationHandler } from './handlers/email-notification.handler';
import { NotificationHandler } from './handlers/notification.handler';

@Module({
  imports: [ConfigModule, RedisModule, MailModule],
  controllers: [FollowUpController, FollowUpCaseAssignmentController],
  providers: [
    FollowUpService,
    FollowUpRepository,
    PrismaService,
    FollowUpCaseEventBus,
    EmailNotificationHandler,
    AuditLogHandler,
    NotificationHandler,
  ],
})
export class FollowUpModule {}