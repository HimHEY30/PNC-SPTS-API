import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FollowUpCaseAssignmentController } from './controllers/follow-up-case-assignment.controller';
import { FollowUpCaseRespondController } from './controllers/follow-up-case-respond.controller';
import { FollowUpController } from './controllers/follow-up.controller';
import { FollowUpService } from './services//follow-up.service';
import { FollowUpRepository } from './follow-up.repository';
import { PrismaService } from '../../database/prisma.service';
import { RedisModule } from '../../redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { FollowUpCaseEventBus } from './events/follow-up-case-event-bus.service';
import { AuditLogHandler } from './handlers/audit-log.handler';
import { EmailNotificationHandler } from './handlers/email-notification.handler';
import { NotificationHandler } from './handlers/notification.handler';
import { AssignmentTokenService } from './services/assignment-token.service';

@Module({
  imports: [ConfigModule, RedisModule, MailModule],
  controllers: [
    FollowUpController,
    FollowUpCaseAssignmentController,
    FollowUpCaseRespondController,
  ],
  providers: [
    FollowUpService,
    FollowUpRepository,
    PrismaService,
    FollowUpCaseEventBus,
    EmailNotificationHandler,
    AuditLogHandler,
    NotificationHandler,
    AssignmentTokenService,
  ],
})
export class FollowUpModule {}
