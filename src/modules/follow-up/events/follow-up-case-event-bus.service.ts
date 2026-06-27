import { Injectable, Logger } from '@nestjs/common';
import { AuditLogHandler } from '../handlers/audit-log.handler';
import { EmailNotificationHandler } from '../handlers/email-notification.handler';
import { NotificationHandler } from '../handlers/notification.handler';
import { FollowUpCaseEvent } from './follow-up-case.events';

@Injectable()
export class FollowUpCaseEventBus {
  private readonly logger = new Logger(FollowUpCaseEventBus.name);

  constructor(
    private readonly emailNotificationHandler: EmailNotificationHandler,
    private readonly auditLogHandler: AuditLogHandler,
    private readonly notificationHandler: NotificationHandler,
  ) {}

  async publish(event: FollowUpCaseEvent): Promise<void> {
    const handlers = [
      this.emailNotificationHandler.handle(event),
      this.auditLogHandler.handle(event),
      this.notificationHandler.handle(event),
    ];

    const results = await Promise.allSettled(handlers);
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(`Handler failed for ${event.name}`, result.reason);
      }
    }
  }
}
