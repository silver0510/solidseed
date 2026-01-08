/**
 * Email Service Configuration
 *
 * Centralized configuration for the Korella email service.
 * Uses Resend as the email provider.
 */

export const emailConfig = {
  // Provider configuration
  provider: 'resend' as const,

  // Sender information
  from: {
    name: 'Korella CRM',
    email: process.env.RESEND_FROM_EMAIL || 'noreply@korella.com',
    get formatted() {
      return `${this.name} <${this.email}>`;
    },
  },

  // Support email
  support: {
    email: 'support@korella.com',
  },

  // Retry configuration for failed email sends
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 10000, // 10 seconds
    backoffMultiplier: 2,
  },

  // Token expiration times (in seconds)
  tokenExpiration: {
    emailVerification: 24 * 60 * 60, // 24 hours
    passwordReset: 60 * 60, // 1 hour
  },

  // Rate limiting
  rateLimit: {
    passwordReset: {
      maxPerHour: 3,
      maxPerEmail: 3,
    },
    verification: {
      maxPerHour: 5,
    },
  },

  // Brand colors for email templates
  branding: {
    primaryColor: '#0070f3',
    primaryColorDark: '#0051a8',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    mutedTextColor: '#666666',
    borderColor: '#e5e7eb',
    logoUrl: '', // Add logo URL when available
  },

  // URL configuration
  urls: {
    get baseUrl() {
      return process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    },
    get verifyEmail() {
      return `${this.baseUrl}/verify-email`;
    },
    get resetPassword() {
      return `${this.baseUrl}/reset-password`;
    },
  },
} as const;

// Email template types
export type EmailTemplateType =
  | 'verification'
  | 'password-reset'
  | 'password-changed'
  | 'account-lockout';

// Template variable types
export interface VerificationTemplateVars {
  userName: string;
  verificationLink: string;
}

export interface PasswordResetTemplateVars {
  userName: string;
  resetLink: string;
}

export interface PasswordChangedTemplateVars {
  userName: string;
}

export interface AccountLockoutTemplateVars {
  userName: string;
  unlockTime: string;
  resetLink: string;
}

export type EmailTemplateVars =
  | VerificationTemplateVars
  | PasswordResetTemplateVars
  | PasswordChangedTemplateVars
  | AccountLockoutTemplateVars;
