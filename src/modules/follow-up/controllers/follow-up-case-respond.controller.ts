import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { AssignmentTokenService } from '../services/assignment-token.service';
import { FollowUpRepository } from '../follow-up.repository';
import { FollowUpService } from '../services/follow-up.service';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * PUBLIC, unauthenticated endpoint reached by clicking the Confirm/Decline
 * buttons in the assignment email. No bearer token required — access is
 * controlled entirely by the single-use, time-limited token in the query
 * string (see AssignmentTokenService).
 */
@ApiExcludeController()
@Controller('follow-up-cases/respond')
export class FollowUpCaseRespondController {
  constructor(
    private readonly tokenService: AssignmentTokenService,
    private readonly followUpService: FollowUpService,
    private readonly repository: FollowUpRepository,
  ) {}

  @Public()
  @Get()
  async respond(
    @Query('token') token: string,
    @Query('action') action: 'accept' | 'reject',
    @Res() res: Response,
  ): Promise<void> {
    if (!token || (action !== 'accept' && action !== 'reject')) {
      this.renderPage(res, 400, 'Invalid Link', 'This link is invalid or malformed.');
      return;
    }

    const payload = await this.tokenService.consume(token);
    if (!payload) {
      this.renderPage(
        res,
        410,
        'Link Expired',
        'This confirmation link has already been used or has expired. ' +
          'Please contact the person who assigned the case.',
      );
      return;
    }

    // Make sure the assignment this token was issued for is still the
    // active one — protects against a stale email link being used after
    // the case was reassigned to someone else.
    const activeAssignment = await this.repository.findActiveAssignmentForCase(payload.caseId);
    if (!activeAssignment || activeAssignment.id !== payload.assignmentId) {
      this.renderPage(
        res,
        409,
        'No Longer Valid',
        'This case has since been reassigned or updated, so this link can no longer be used.',
      );
      return;
    }

    const actor: AuthenticatedUser = {
      user_id: payload.teacherId,
      entity_type: 'teacher',
      roles: ['TEACHER'],
    };

    try {
      if (action === 'accept') {
        await this.followUpService.acceptCase(payload.caseId, actor);
        this.renderPage(
          res,
          200,
          'Assignment Confirmed',
          'Thank you — you have confirmed this follow-up case assignment.',
        );
      } else {
        await this.followUpService.rejectCase(
          payload.caseId,
          { reason: 'Rejected via email confirmation link.' },
          actor,
        );
        this.renderPage(
          res,
          200,
          'Assignment Declined',
          'You have declined this follow-up case assignment. The person who assigned it has been notified.',
        );
      }
    } catch (err) {
      this.renderPage(
        res,
        500,
        'Something Went Wrong',
        'We could not process your response. Please contact support or use the app directly.',
      );
    }
  }

  /**
   * Upgraded GenZ Dark Mode Cyber Dashboard Layout 
   */
  private renderPage(res: Response, status: number, title: string, message: string): void {
    const isSuccess = status === 200;
    const badgeText = isSuccess ? 'SYSTEM SYNCED' : 'SYSTEM ALERT';
    const accentColor = isSuccess ? '#10b981' : '#f43f5e'; // Emerald Green vs Vibrant Rose Red
    const glowColor = isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

    res
      .status(status)
      .type('html')
      .send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>${title}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                background-color: #0b0f19;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 24px;
                overflow: hidden;
                position: relative;
              }
              /* Cyber Ambient Background Glows */
              .glow-1 {
                position: absolute; width: 400px; height: 400px; background: ${glowColor};
                filter: blur(120px); border-radius: 50%; top: -10%; left: -10%; z-index: 1;
              }
              .glow-2 {
                position: absolute; width: 300px; height: 300px; background: rgba(79, 70, 229, 0.08);
                filter: blur(100px); border-radius: 50%; bottom: -5%; right: -5%; z-index: 1;
              }
              /* App Card Container */
              .card {
                background: rgba(21, 28, 44, 0.75);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0px rgba(255, 255, 255, 0.1);
                max-width: 440px;
                width: 100%;
                border-radius: 24px;
                padding: 40px 32px;
                text-align: center;
                z-index: 2;
                position: relative;
              }
              /* Tech Pill Badge */
              .badge {
                display: inline-block;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                color: ${accentColor};
                background: ${glowColor};
                border: 1px solid rgba(${isSuccess ? '16, 185, 129' : '244, 63, 94'}, 0.3);
                padding: 6px 14px;
                border-radius: 100px;
                margin-bottom: 24px;
              }
              /* Dynamic Top Highlight Bar */
              .card::before {
                content: ''; position: absolute; top: 0; left: 30px; right: 30px; height: 2px;
                background: linear-gradient(90deg, transparent, ${accentColor}, transparent);
              }
              h2 {
                font-size: 24px;
                font-weight: 800;
                line-height: 1.25;
                color: #ffffff;
                margin-bottom: 14px;
                letter-spacing: -0.02em;
              }
              p {
                color: #94a3b8;
                font-size: 15px;
                line-height: 1.6;
                font-weight: 400;
                margin-bottom: 32px;
              }
              /* Micro Interactive Return Utility Element */
              .footer-hint {
                font-size: 12px;
                color: #475569;
                font-weight: 500;
                letter-spacing: 0.01em;
              }
            </style>
          </head>
          <body>
            <div class="glow-1"></div>
            <div class="glow-2"></div>
            
            <div class="card">
              <span class="badge">${badgeText}</span>
              <h2>${title}</h2>
              <p>${message}</p>
              <div class="footer-hint">You can safely close this browser window now.</div>
            </div>
          </body>
        </html>
      `);
    }
}