import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;

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
      subject: 'Password Reset Request',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Use the following code to reset your password. The code expires in <strong>1 hour</strong>.</p>
        <p><b>${resetCode}</b></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}`, err);
      throw err;
    }
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Cannot send email to ${options.to} — SMTP not configured`);
      return;
    }

    const from = this.config.get<string>('SMTP_FROM');
    if (!from) {
      throw new Error('SMTP_FROM is not configured');
    }

    try {
      await this.transporter.sendMail({
        from,
        ...options,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}`, err);
      throw err;
    }
  }
}
