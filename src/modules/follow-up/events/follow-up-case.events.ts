export type FollowUpCaseEventName =
  | 'CaseAssignedEvent'
  | 'CaseAcceptedEvent'
  | 'CaseRejectedEvent'
  | 'CaseCompletedEvent';

export interface FollowUpCaseEventPayload {
  caseId: string;
  assignmentId: string;
  actor: {
    id: string;
    name?: string;
    email?: string;
  };
  assignedBy?: {
    id: string;
    name?: string;
    email?: string;
  };
  assignedTo: {
    id: string;
    name?: string;
    email?: string;
  };
  case: {
    id: string;
    title: string;
    priority: string;
    studentName?: string;
    followUpType?: string;
    dueDate?: Date | string | null;
  };
  previousStatus?: string | null;
  newStatus: string;
  remarks?: string | null;
}

export abstract class FollowUpCaseEvent {
  abstract readonly name: FollowUpCaseEventName;

  constructor(public readonly payload: FollowUpCaseEventPayload) {}
}

export class CaseAssignedEvent extends FollowUpCaseEvent {
  readonly name = 'CaseAssignedEvent' as const;
}

export class CaseAcceptedEvent extends FollowUpCaseEvent {
  readonly name = 'CaseAcceptedEvent' as const;
}

export class CaseRejectedEvent extends FollowUpCaseEvent {
  readonly name = 'CaseRejectedEvent' as const;
}

export class CaseCompletedEvent extends FollowUpCaseEvent {
  readonly name = 'CaseCompletedEvent' as const;
}
