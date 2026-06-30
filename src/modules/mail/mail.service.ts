import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  private readonly brandName = 'PNC Portal';
  private readonly brandColor = '#6366f1'; 

  // 🌟 CHANGED: Replaced the local file path string with the hosted image URL
  private readonly brandLogoUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBRKT3alDBUe7W5eORDQMALS6hDypkSKQRsXfPBQUvBA&s=10';

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = parseInt(this.config.get<string>('SMTP_PORT'), 10);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.logger.log(
      `SMTP config — host: ${host}, port: ${port}, user: ${user}, pass: ${pass ? '***set***' : 'MISSING'}`,
    );

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        `SMTP not configured (missing ${[
          !host && 'SMTP_HOST',
          !port && 'SMTP_PORT',
          !user && 'SMTP_USER',
          !pass && 'SMTP_PASS',
        ]
          .filter(Boolean)
          .join(', ')}) — email features disabled`,
      );
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified ✓');
    } catch (err) {
      this.logger.error('SMTP connection failed ✗', err);
    }
  }

  async sendPasswordReset(to: string, resetCode: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Cannot send email — SMTP not configured`);
      return;
    }
    const from = this.config.get<string>('SMTP_FROM');
    if (!from) {
      throw new Error('SMTP_FROM is not configured');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to,
      subject: 'Security Sync: Password Reset Request',
      html: this.brandedLayout(`
        <tr>
          <td style="padding: 40px 40px 0;">
            <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:${this.brandColor};background:rgba(99,102,241,0.12);padding:6px 12px;border-radius:100px;border:1px solid rgba(99,102,241,0.25);">SECURITY UNIT</span>
            <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.25;color:#ffffff;font-weight:800;letter-spacing:-0.02em;">
              Reset your password
            </h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#94a3b8;">
              Hello, you requested a token authorization cycle reset. Enter the synchronization code below to proceed. This code expires in <strong>1 hour</strong>.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding: 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid rgba(255,255,255,0.06);border-radius:16px;background:rgba(255,255,255,0.01);overflow:hidden;">
              <tr>
                <td align="center" style="padding:24px;">
                  <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#ffffff;">
                    ${this.escape(resetCode)}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${this.privacyNote(
          'If you did not request this, you can safely ignore this payload string — your security metrics remain unchanged.',
        )}
      `),
      text: [
        'Reset your password',
        '',
        'You requested a password reset. Use the following code to reset your password.',
        'The code expires in 1 hour.',
        '',
        `Code: ${resetCode}`,
        '',
        'If you did not request this, you can safely ignore this email.',
      ].join('\n'),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}`, err);
      throw err;
    }
  }

  private brandedLayout(bodyRows: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:48px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:540px;background:#151c2c;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px -15px rgba(0, 0, 0, 0.6);border:1px solid rgba(255, 255, 255, 0.06);">
                  <tr>
                    <td style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,0.06);background:#151c2c;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:middle;padding-right:12px;">
                            <img src="${this.brandLogoUrl}" alt="${this.escape(this.brandName)}"
                                 width="36" height="36"
                                 style="display:block;width:36px;height:36px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,255,255,0.1);" />
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.02em;">
                              ${this.escape(this.brandName)}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ${bodyRows}
                  <tr>
                    <td style="height:40px;"></td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:11px;color:#475569;max-width:540px;text-align:center;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
                  // AUTOMATED SYSTEM PIPELINE — DISPATCH UNIT
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private privacyNote(html: string): string {
    return `
      <tr>
        <td style="padding: 28px 40px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:rgba(255,255,255,0.02);border-radius:14px;padding:16px 20px;border:1px solid rgba(255,255,255,0.04);">
            <tr>
              <td style="font-size:12px;line-height:1.6;color:#64748b;font-weight:400;">
                ${html}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: any[];
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Cannot send email to ${options.to} — SMTP not configured`);
      return;
    }

    const from = this.config.get<string>('SMTP_FROM');
    if (!from) {
      throw new Error('SMTP_FROM is not configured');
    }

    // 🌟 CHANGED: Cleaned up the old attachment injection code block.
    // It will no longer search for local files or crash on missing assets.
    const mailAttachments = options.attachments || [];

    try {
      await this.transporter.sendMail({
        from,
        ...options,
        attachments: mailAttachments,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}`, err);
      throw err;
    }
  }
}