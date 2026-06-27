import { Injectable } from '@nestjs/common';
import { FollowUpRepository } from '../follow-up.repository';
import { FollowUpCaseEvent } from '../events/follow-up-case.events';

@Injectable()
export class NotificationHandler {
  constructor(private readonly repository: FollowUpRepository) {}

  async handle(event: FollowUpCaseEvent): Promise<void> {
    const recipientId =
      event.name === 'CaseAssignedEvent'
        ? event.payload.assignedTo.id
        : event.payload.assignedBy?.id;

    if (!recipientId) return;

    await this.repository.createNotification({
      userId: recipientId,
      title: this.titleFor(event),
      message: this.messageFor(event),
      type: event.name,
      entityType: 'FOLLOW_UP_CASE',
      entityId: event.payload.caseId,
    });
  }

  private titleFor(event: FollowUpCaseEvent): string {
    switch (event.name) {
      case 'CaseAssignedEvent':
        return 'New Follow-Up Case Assigned';
      case 'CaseAcceptedEvent':
        return 'Follow-Up Case Accepted';
      case 'CaseRejectedEvent':
        return 'Follow-Up Case Rejected';
      case 'CaseCompletedEvent':
        return 'Follow-Up Case Completed';
    }
  }

  private messageFor(event: FollowUpCaseEvent): string {
    return `${event.payload.case.title} is now ${event.payload.newStatus}.`;
  }
}
