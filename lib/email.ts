import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';
import { emailConfig } from './config/email.config';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// Types and Interfaces
// ============================================================================

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

export interface EmailError extends Error {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}

// Email service interface as specified in requirements
export interface IEmailService {
  sendVerificationEmail(to: string, name: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, name: string, token: string): Promise<void>;
  sendPasswordChangedEmail(to: string, name: string): Promise<void>;
  sendAccountLockoutEmail(
    to: string,
    name: string,
    unlockTime: Date,
    resetToken: string
  ): Promise<void>;
}

// ============================================================================
// Template Loading Utilities
// ============================================================================

type TemplateVariables = Record<string, string>;

/**
 * Loads an HTML email template from the templates directory
 */
function loadTemplate(templateName: string): string {
  try {
    const templatePath = join(
      process.cwd(),
      'lib',
      'templates',
      'emails',
      `${templateName}.html`
    );
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error);
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Replaces template variables in the format {{variable_name}} with actual values
 */
function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  }

  // Always add base_url
  rendered = rendered.replace(
    /\{\{\s*base_url\s*\}\}/g,
    emailConfig.urls.baseUrl
  );

  return rendered;
}

/**
 * Generates plain text version from HTML by stripping tags
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates delay for exponential backoff
 */
function calculateBackoffDelay(attempt: number): number {
  const { initialDelayMs, maxDelayMs, backoffMultiplier } = emailConfig.retry;
  const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const emailError = error as EmailError;
    // Retry on network errors or 5xx status codes
    if (emailError.statusCode && emailError.statusCode >= 500) {
      return true;
    }
    // Retry on rate limiting (429)
    if (emailError.statusCode === 429) {
      return true;
    }
    // Retry on connection errors
    if (
      emailError.code === 'ECONNRESET' ||
      emailError.code === 'ETIMEDOUT' ||
      emailError.code === 'ENOTFOUND'
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Executes a function with retry logic
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  const { maxAttempts } = emailConfig.retry;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !isRetryableError(error)) {
        console.error(
          `[EmailService] ${context} failed after ${attempt} attempt(s):`,
          lastError.message
        );
        throw lastError;
      }

      const backoffDelay = calculateBackoffDelay(attempt);
      console.warn(
        `[EmailService] ${context} failed (attempt ${attempt}/${maxAttempts}), retrying in ${backoffDelay}ms...`,
        lastError.message
      );

      await delay(backoffDelay);
    }
  }

  throw lastError;
}

// ============================================================================
// Email Service Class
// ============================================================================

export class EmailService {
  private static FROM_EMAIL =
    process.env.RESEND_FROM_EMAIL || emailConfig.from.email;
  private static FROM_NAME = emailConfig.from.name;

  /**
   * Sends an email with retry logic
   */
  static async sendEmail({
    to,
    subject,
    html,
    text,
    from,
    replyTo,
  }: SendEmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(to) ? to : [to];
    const senderAddress =
      from || `${this.FROM_NAME} <${this.FROM_EMAIL}>`;
    const plainText = text || htmlToPlainText(html);

    return withRetry(async () => {
      const { data, error } = await resend.emails.send({
        from: senderAddress,
        to: recipients,
        subject,
        html,
        text: plainText,
        replyTo,
      });

      if (error) {
        const emailError: EmailError = new Error(
          `Failed to send email: ${error.message}`
        );
        emailError.code = 'RESEND_ERROR';
        throw emailError;
      }

      console.log(`[EmailService] Email sent successfully: ${data!.id}`);

      return {
        id: data!.id,
        success: true,
      };
    }, `Sending email to ${recipients.join(', ')}`);
  }

  /**
   * Sends email verification email to new users
   */
  static async sendVerificationEmail(
    to: string,
    name: string,
    token: string
  ): Promise<void> {
    const verificationLink = `${emailConfig.urls.verifyEmail}?token=${token}`;

    const template = loadTemplate('verification');
    const html = renderTemplate(template, {
      user_name: name,
      verification_link: verificationLink,
    });

    await this.sendEmail({
      to,
      subject: 'Verify your Korella account',
      html,
      text: `Hi ${name},\n\nWelcome to Korella! Please verify your email address by visiting:\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't create a Korella account, please ignore this email.\n\nThanks,\nThe Korella Team`,
    });
  }

  /**
   * Sends password reset email
   */
  static async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string
  ): Promise<void> {
    const resetLink = `${emailConfig.urls.resetPassword}?token=${token}`;

    const template = loadTemplate('password-reset');
    const html = renderTemplate(template, {
      user_name: name,
      reset_link: resetLink,
    });

    await this.sendEmail({
      to,
      subject: 'Reset your Korella password',
      html,
      text: `Hi ${name},\n\nWe received a request to reset your password for your Korella account.\n\nReset your password by visiting:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\nThanks,\nThe Korella Team`,
    });
  }

  /**
   * Sends password changed confirmation email
   */
  static async sendPasswordChangedEmail(to: string, name: string): Promise<void> {
    const changeTime = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    });

    const template = loadTemplate('password-changed');
    const html = renderTemplate(template, {
      user_name: name,
      user_email: to,
      change_time: `${changeTime} (UTC)`,
    });

    await this.sendEmail({
      to,
      subject: 'Your Korella password was changed',
      html,
      text: `Hi ${name},\n\nYour Korella account password was successfully changed.\n\nIf you made this change, no further action is needed.\n\nIf you didn't change your password, please contact our support team immediately at support@korella.com.\n\nThanks,\nThe Korella Team`,
    });
  }

  /**
   * Sends account lockout alert email
   */
  static async sendAccountLockoutEmail(
    to: string,
    name: string,
    unlockTime: Date,
    resetToken: string
  ): Promise<void> {
    const resetLink = `${emailConfig.urls.resetPassword}?token=${resetToken}`;
    const formattedUnlockTime = unlockTime.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    });

    const template = loadTemplate('account-lockout');
    const html = renderTemplate(template, {
      user_name: name,
      unlock_time: `${formattedUnlockTime} (UTC)`,
      reset_link: resetLink,
    });

    await this.sendEmail({
      to,
      subject: 'Security alert: Your Korella account was locked',
      html,
      text: `Hi ${name},\n\nWe detected multiple failed login attempts on your Korella account. To protect your account, we've temporarily locked it for 30 minutes.\n\nYour account will automatically unlock at ${formattedUnlockTime} (UTC).\n\nIf this wasn't you, we recommend resetting your password immediately:\n${resetLink}\n\nIf you have any concerns, contact our support team at support@korella.com.\n\nThanks,\nThe Korella Team`,
    });
  }
}

// ============================================================================
// Singleton Instance Export (for IEmailService interface compliance)
// ============================================================================

export const emailService: IEmailService = {
  sendVerificationEmail: EmailService.sendVerificationEmail.bind(EmailService),
  sendPasswordResetEmail: EmailService.sendPasswordResetEmail.bind(EmailService),
  sendPasswordChangedEmail: EmailService.sendPasswordChangedEmail.bind(EmailService),
  sendAccountLockoutEmail: EmailService.sendAccountLockoutEmail.bind(EmailService),
};

// Default export for convenience
export default EmailService;
