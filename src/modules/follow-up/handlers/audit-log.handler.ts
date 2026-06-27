import { Injectable } from '@nestjs/common';
import { FollowUpRepository } from '../follow-up.repository';
import { FollowUpCaseEvent } from '../events/follow-up-case.events';

const AUDIT_ACTION_BY_EVENT = {
  CaseAssignedEvent: 'CASE_ASSIGNED',
  CaseAcceptedEvent: 'CASE_ACCEPTED',
  CaseRejectedEvent: 'CASE_REJECTED',
  CaseCompletedEvent: 'CASE_COMPLETED',
} as const;

@Injectable()
export class AuditLogHandler {
  constructor(private readonly repository: FollowUpRepository) {}

  async handle(event: FollowUpCaseEvent): Promise<void> {
    await this.repository.createAuditLog({
      userId: event.payload.actor.id,
      userName: event.payload.actor.name,
      action: AUDIT_ACTION_BY_EVENT[event.name],
      entityType: 'FOLLOW_UP_CASE',
      entityId: event.payload.caseId,
      previousStatus: event.payload.previousStatus,
      newStatus: event.payload.newStatus,
    });
  }
}
