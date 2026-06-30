import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/mail.service';
import { FollowUpCaseEvent } from '../events/follow-up-case.events';
import { AssignmentTokenService } from '../services/assignment-token.service';

const BRAND_NAME = 'Follow-Up Cases';
const BRAND_COLOR = '#0a66c2'; // LinkedIn-style single accent blue

// 🌟 CHANGED: Replaced 'cid:brandlogo' with the hosted image URL
const BRAND_LOGO_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBRKT3alDBUe7W5eORDQMALS6hDypkSKQRsXfPBQUvBA&s=10'; 

const PRIORITY_LABEL: Record<string, string> = {
// ... rest of your code remains the same
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
};

@Injectable()
export class EmailNotificationHandler {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly assignmentTokenService: AssignmentTokenService,
  ) {}

  async handle(event: FollowUpCaseEvent): Promise<void> {
    if (event.name === 'CaseAssignedEvent') {
      await this.sendAssignmentEmail(event);
      return;
    }

    if (event.name === 'CaseRejectedEvent') {
      await this.sendStatusEmail(event, 'This case was declined');
      return;
    }

    if (event.name === 'CaseCompletedEvent') {
      await this.sendStatusEmail(event, 'This case was completed');
    }
  }

  // ── Teacher / tutor view: new assignment, needs a response ───────────────

  private async sendAssignmentEmail(event: FollowUpCaseEvent): Promise<void> {
    const { assignedTo, actor, payloadCase } = this.pickEmailContext(event);
    if (!assignedTo.email) return;

    const token = await this.assignmentTokenService.create({
      assignmentId: event.payload.assignmentId,
      caseId: payloadCase.id,
      teacherId: assignedTo.id,
      teacherName: assignedTo.name,
      teacherEmail: assignedTo.email,
    });

    const confirmUrl = this.respondUrl(token, 'accept');
    const declineUrl = this.respondUrl(token, 'reject');
    const priorityLabel =
      PRIORITY_LABEL[(payloadCase.priority || '').toLowerCase()] ?? payloadCase.priority ?? 'N/A';

    const body = `
      <tr>
        <td style="padding: 36px 40px 0;">
          <h1 style="margin:0 0 8px;font-size:20px;line-height:1.4;color:#191919;font-weight:600;">
            You've been assigned a follow-up case
          </h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#666666;">
            Hi ${this.escape(assignedTo.name || 'there')}, ${this.escape(
              actor.name || actor.id,
            )} assigned the case below to you. Please confirm whether you can take it on.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding: 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #e0e0e0;border-radius:8px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#191919;">
                  ${this.escape(payloadCase.title)}
                </p>
                ${this.detailRow('Student', payloadCase.studentName || 'N/A')}
                ${this.detailRow('Type', payloadCase.followUpType || 'N/A')}
                ${this.detailRow('Priority', priorityLabel)}
                ${this.detailRow('Due date', this.formatDate(payloadCase.dueDate))}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding: 28px 40px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-bottom:12px;">
                <a href="${confirmUrl}"
                   style="display:inline-block;width:240px;background:${BRAND_COLOR};color:#ffffff;
                          font-size:15px;font-weight:600;text-decoration:none;padding:13px 0;
                          border-radius:24px;text-align:center;">
                  Confirm assignment
                </a>
              </td>
            </tr>
            <tr>
              <td align="center">
                <a href="${declineUrl}"
                   style="display:inline-block;width:240px;background:#ffffff;color:#434649;
                          font-size:15px;font-weight:600;text-decoration:none;padding:11px 0;
                          border-radius:24px;text-align:center;border:1px solid #666666;">
                  Decline
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${this.privacyNote(
        'This link is single-use and expires in 7 days. You can also respond from inside the app — ' +
          `<a href="${this.caseUrl(payloadCase.id)}" style="color:${BRAND_COLOR};text-decoration:none;">open this case</a>.`,
      )}
    `;

    await this.mailService.sendMail({
      to: assignedTo.email,
      subject: `New case assigned: ${payloadCase.title}`,
      html: this.layout(body),
      text: this.assignmentText({
        assignedToName: assignedTo.name,
        actorName: actor.name || actor.id,
        payloadCase,
        priorityLabel,
        confirmUrl,
        declineUrl,
      }),
    });
  }

  // ── Admin / case-owner view: status update, no action needed ─────────────

  private async sendStatusEmail(event: FollowUpCaseEvent, heading: string): Promise<void> {
    const { assignedBy, payloadCase } = this.pickEmailContext(event);
    if (!assignedBy?.email) return;

    const body = `
      <tr>
        <td style="padding: 36px 40px 0;">
          <h1 style="margin:0 0 8px;font-size:20px;line-height:1.4;color:#191919;font-weight:600;">
            ${this.escape(heading)}
          </h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#666666;">
            Hi ${this.escape(assignedBy.name || 'there')}, here's an update on a case you assigned.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding: 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #e0e0e0;border-radius:8px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#191919;">
                  ${this.escape(payloadCase.title)}
                </p>
                ${this.detailRow('Student', payloadCase.studentName || 'N/A')}
                ${this.detailRow(
                  'Status change',
                  `${event.payload.previousStatus || 'N/A'} → ${event.payload.newStatus}`,
                )}
                ${this.detailRow('Remarks', event.payload.remarks || 'N/A')}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 28px 40px 0;">
          <a href="${this.caseUrl(payloadCase.id)}"
             style="display:inline-block;width:240px;background:${BRAND_COLOR};color:#ffffff;
                    font-size:15px;font-weight:600;text-decoration:none;padding:13px 0;
                    border-radius:24px;text-align:center;">
            Open case details
          </a>
        </td>
      </tr>

      ${this.privacyNote('You can manage notification preferences for this case from inside the app.')}
    `;

    await this.mailService.sendMail({
      to: assignedBy.email,
      subject: `${heading}: ${payloadCase.title}`,
      html: this.layout(body),
      text: this.statusText({ assignedByName: assignedBy.name, heading, event, payloadCase }),
    });
  }

  // ── Shared layout pieces ───────────────────────────────────────────────────

  private layout(bodyRows: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
                  <tr>
                    <td style="padding:20px 40px;border-bottom:1px solid #e0e0e0;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:middle;padding-right:10px;">
                            <img src="${BRAND_LOGO_URL}" alt="${this.escape(BRAND_NAME)}"
                                 width="28" height="28"
                                 style="display:block;width:28px;height:28px;object-fit:contain;" />
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="color:${BRAND_COLOR};font-size:18px;font-weight:700;">
                              ${this.escape(BRAND_NAME)}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ${bodyRows}
                  <tr>
                    <td style="height:32px;"></td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:12px;color:#86888a;max-width:520px;">
                  This is an automated message — please don't reply directly to this email.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private detailRow(label: string, value: string): string {
    return `
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#666666;width:34%;">${this.escape(label)}</td>
        <td style="padding:5px 0;font-size:13px;color:#191919;font-weight:500;">${this.escape(value)}</td>
      </tr>
    `;
  }

  private privacyNote(html: string): string {
    return `
      <tr>
        <td style="padding: 24px 40px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f4f2ee;border-radius:8px;padding:14px 18px;">
            <tr>
              <td style="font-size:12px;line-height:1.6;color:#666666;">
                ${html}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  // ── Plain-text fallbacks ─────────────────────────────────────────────────

  private assignmentText(args: {
    assignedToName?: string;
    actorName: string;
    payloadCase: FollowUpCaseEvent['payload']['case'];
    priorityLabel: string;
    confirmUrl: string;
    declineUrl: string;
  }): string {
    const { assignedToName, actorName, payloadCase, priorityLabel, confirmUrl, declineUrl } = args;
    return [
      `Hi ${assignedToName || 'there'},`,
      '',
      `${actorName} assigned you a follow-up case: ${payloadCase.title}`,
      '',
      `Student: ${payloadCase.studentName || 'N/A'}`,
      `Type: ${payloadCase.followUpType || 'N/A'}`,
      `Priority: ${priorityLabel}`,
      `Due date: ${this.formatDate(payloadCase.dueDate)}`,
      '',
      `Confirm: ${confirmUrl}`,
      `Decline: ${declineUrl}`,
      '',
      `Or open this case in the app: ${this.caseUrl(payloadCase.id)}`,
    ].join('\n');
  }

  private statusText(args: {
    assignedByName?: string;
    heading: string;
    event: FollowUpCaseEvent;
    payloadCase: FollowUpCaseEvent['payload']['case'];
  }): string {
    const { assignedByName, heading, event, payloadCase } = args;
    return [
      `Hi ${assignedByName || 'there'},`,
      '',
      `${heading}: ${payloadCase.title}`,
      '',
      `Student: ${payloadCase.studentName || 'N/A'}`,
      `Status change: ${event.payload.previousStatus || 'N/A'} -> ${event.payload.newStatus}`,
      `Remarks: ${event.payload.remarks || 'N/A'}`,
      '',
      `Open this case in the app: ${this.caseUrl(payloadCase.id)}`,
    ].join('\n');
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
    const apiPrefix = this.configService.get<string>('app.apiPrefix') || 'api';
    return `${this.appBaseUrl()}/${apiPrefix}/follow-up/cases/${caseId}`;
  }

  private respondUrl(token: string, action: 'accept' | 'reject'): string {
    const apiPrefix = this.configService.get<string>('app.apiPrefix') || 'api';
    return `${this.appBaseUrl()}/${apiPrefix}/follow-up-cases/respond?token=${encodeURIComponent(
      token,
    )}&action=${action}`;
  }

  private appBaseUrl(): string {
    return (
      this.configService.get<string>('app.baseUrl') ||
      this.configService.get<string>('APP_BASE_URL') ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) return 'N/A';
    return new Date(value).toISOString().slice(0, 10);
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}