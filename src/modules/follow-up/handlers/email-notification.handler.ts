import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/mail.service';
import { FollowUpCaseEvent } from '../events/follow-up-case.events';

@Injectable()
export class EmailNotificationHandler {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async handle(event: FollowUpCaseEvent): Promise<void> {
    if (event.name === 'CaseAssignedEvent') {
      await this.sendAssignmentEmail(event);
      return;
    }

    if (event.name === 'CaseRejectedEvent') {
      await this.sendStatusEmail(event, 'Follow-Up Case Rejected');
      return;
    }

    if (event.name === 'CaseCompletedEvent') {
      await this.sendStatusEmail(event, 'Follow-Up Case Completed');
    }
  }

  private async sendAssignmentEmail(event: FollowUpCaseEvent): Promise<void> {
    const { assignedTo, actor, payloadCase } = this.pickEmailContext(event);
    if (!assignedTo.email) return;

    await this.mailService.sendMail({
      to: assignedTo.email,
      subject: 'New Follow-Up Case Assigned',
      html: `
        <p>Hello ${assignedTo.name || 'Teacher'},</p>
        <p>A new follow-up case has been assigned to you.</p>
        <ul>
          <li><strong>Case ID:</strong> ${payloadCase.id}</li>
          <li><strong>Student:</strong> ${payloadCase.studentName || 'N/A'}</li>
          <li><strong>Follow-Up Type:</strong> ${payloadCase.followUpType || 'N/A'}</li>
          <li><strong>Priority:</strong> ${payloadCase.priority}</li>
          <li><strong>Due Date:</strong> ${this.formatDate(payloadCase.dueDate)}</li>
          <li><strong>Assigned By:</strong> ${actor.name || actor.id}</li>
        </ul>
        <p><a href="${this.caseUrl(payloadCase.id)}">Open case details</a></p>
      `,
    });
  }

  private async sendStatusEmail(event: FollowUpCaseEvent, subject: string): Promise<void> {
    const { assignedBy, payloadCase } = this.pickEmailContext(event);
    if (!assignedBy?.email) return;

    await this.mailService.sendMail({
      to: assignedBy.email,
      subject,
      html: `
        <p>Follow-up case ${payloadCase.id} was updated.</p>
        <ul>
          <li><strong>Student:</strong> ${payloadCase.studentName || 'N/A'}</li>
          <li><strong>Previous Status:</strong> ${event.payload.previousStatus || 'N/A'}</li>
          <li><strong>New Status:</strong> ${event.payload.newStatus}</li>
          <li><strong>Remarks:</strong> ${event.payload.remarks || 'N/A'}</li>
        </ul>
        <p><a href="${this.caseUrl(payloadCase.id)}">Open case details</a></p>
      `,
    });
  }

  private pickEmailContext(event: FollowUpCaseEvent) {
    return {
      actor: event.payload.actor,
      assignedBy: event.payload.assignedBy,
      assignedTo: event.payload.assignedTo,
      payloadCase: event.payload.case,
    };
  }

  private caseUrl(caseId: string): string {
    const baseUrl =
      this.configService.get<string>('app.baseUrl') ||
      this.configService.get<string>('APP_BASE_URL') ||
      'http://localhost:3000';
    const apiPrefix = this.configService.get<string>('app.apiPrefix') || 'api';
    return `${baseUrl.replace(/\/$/, '')}/${apiPrefix}/follow-up/cases/${caseId}`;
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) return 'N/A';
    return new Date(value).toISOString().slice(0, 10);
  }
}
