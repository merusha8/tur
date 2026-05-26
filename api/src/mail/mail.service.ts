import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly smtpConfigured: boolean;
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    this.smtpConfigured = !!host;

    if (this.smtpConfigured) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') || 587),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
  }

  isConfigured() {
    return this.smtpConfigured;
  }

  async sendVerificationCode(email: string, code: string) {
    await this.dispatch(
      email,
      'Verify your Meru Tour account',
      `Your verification code is: ${code}`,
      `<p>Welcome to <strong>Meru Tour</strong>.</p><p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>`,
    );
  }

  async sendPasswordResetCode(email: string, code: string) {
    await this.dispatch(
      email,
      'Reset your Meru Tour password',
      `Your password reset code is: ${code}`,
      `<p>Your password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>`,
    );
  }

  async sendBookingConfirmation(email: string, reference: string, totalPrice: number) {
    await this.dispatch(
      email,
      `Booking confirmed — ${reference}`,
      `Your booking ${reference} has been confirmed. Total: $${totalPrice.toFixed(2)}`,
      `<p>Your booking <strong>${reference}</strong> is confirmed.</p><p>Total paid: <strong>$${totalPrice.toFixed(2)}</strong></p>`,
    );
  }

  private async dispatch(to: string, subject: string, text: string, html?: string) {
    const from = this.config.get('SMTP_FROM') || 'hello@merutour.com';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from, to, subject, text, html: html || text });
        this.logger.log(`[mail] Sent "${subject}" to ${to}`);
        return;
      } catch (err) {
        this.logger.error(`[mail] SMTP failed for ${to}: ${(err as Error).message}`);
        throw err;
      }
    }

    this.logger.warn(`[mail][demo] ${subject} → ${to}: ${text}`);
  }
}
