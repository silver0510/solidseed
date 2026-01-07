import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  id: string;
  success: boolean;
}

export class EmailService {
  private static FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  private static FROM_NAME = 'Korella CRM';

  static async sendEmail({
    to,
    subject,
    html,
    text,
    from,
    replyTo,
  }: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const { data, error } = await resend.emails.send({
        from: from || `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        replyTo,
      });

      if (error) {
        console.error('Email send error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      return {
        id: data!.id,
        success: true,
      };
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  static async sendVerificationEmail(
    email: string,
    verificationUrl: string
  ): Promise<SendEmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Verify your email address</h1>
            <p>Thank you for signing up for Korella CRM! Please verify your email address by clicking the button below:</p>
            <p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify your email address - Korella CRM',
      html,
      text: `Verify your email address by visiting: ${verificationUrl}`,
    });
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<SendEmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset your password</h1>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset your password - Korella CRM',
      html,
      text: `Reset your password by visiting: ${resetUrl}`,
    });
  }
}
