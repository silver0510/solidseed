/**
 * Email Service Integration for Korella CRM
 *
 * This module provides email sending functionality using Resend.
 * It handles email verification, password resets, and security alerts.
 *
 * Environment Variables Required:
 * - RESEND_API_KEY: Resend API key
 * - RESEND_FROM_EMAIL: Sender email address (must be verified in Resend)
 */

import { Resend } from 'resend';

// =============================================================================
// Environment Validation
// =============================================================================

/**
 * Validates that all required email environment variables are set
 * @throws Error if any required variable is missing
 *
 * Note: RESEND_FROM_EMAIL is optional - defaults to 'onboarding@resend.dev' in development mode
 */
export function validateEmailConfig(): void {
  const required = ['RESEND_API_KEY'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required email service environment variables: ${missing.join(', ')}`
    );
  }
}

// =============================================================================
// Email Service Configuration
// =============================================================================

/**
 * Resend client instance (singleton)
 */
let resendInstance: Resend | null = null;

/**
 * Gets or creates the Resend client instance
 */
export function getResendClient(): Resend {
  if (!resendInstance) {
    validateEmailConfig();
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

/**
 * Sender email address
 */
export const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Application base URL for email links
 */
export const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// =============================================================================
// Email Templates
// =============================================================================

/**
 * Email verification template
 */
export interface EmailVerificationParams {
  to: string;
  userName: string;
  verificationLink: string;
}

export async function sendEmailVerificationEmail(params: EmailVerificationParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: 'Verify Your Email Address - Korella CRM',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Korella CRM!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${params.userName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Thank you for signing up for Korella CRM! Please verify your email address to activate your account.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${params.verificationLink}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Verify Email Address</a>
              </div>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">This link will expire in 24 hours.</p>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">If you didn't create an account with Korella CRM, you can safely ignore this email.</p>
              <p style="font-size: 14px; color: #666;">Best regards,<br>The Korella CRM Team</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Password reset template
 */
export interface PasswordResetParams {
  to: string;
  userName: string;
  resetLink: string;
}

export async function sendPasswordResetEmail(params: PasswordResetParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: 'Reset Your Password - Korella CRM',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${params.userName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset your password. Click the button below to create a new password.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${params.resetLink}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Reset Password</a>
              </div>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">This link will expire in 1 hour.</p>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">If you didn't request a password reset, you can safely ignore this email.</p>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">For your security, please don't share this link with anyone.</p>
              <p style="font-size: 14px; color: #666;">Best regards,<br>The Korella CRM Team</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Password changed confirmation template
 */
export interface PasswordChangedParams {
  to: string;
  userName: string;
  changedAt: Date;
}

export async function sendPasswordChangedEmail(params: PasswordChangedParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: 'Password Changed Successfully - Korella CRM',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${params.userName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Your password was successfully changed on ${params.changedAt.toLocaleString()}.</p>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">If you didn't make this change, please contact our support team immediately.</p>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">For your security, you may want to review your recent account activity.</p>
              <p style="font-size: 14px; color: #666;">Best regards,<br>The Korella CRM Team</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Account lockout security alert template
 */
export interface AccountLockoutAlertParams {
  to: string;
  userName: string;
  lockedUntil: Date;
  ipAddress?: string;
}

export async function sendAccountLockoutAlertEmail(params: AccountLockoutAlertParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: 'Security Alert: Account Locked - Korella CRM',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Security Alert</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Security Alert</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${params.userName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We've detected multiple failed login attempts on your account. For your security, your account has been temporarily locked.</p>
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="font-size: 14px; margin: 0; color: #856404;"><strong>Account locked until:</strong> ${params.lockedUntil.toLocaleString()}</p>
              </div>
              ${params.ipAddress ? `<p style="font-size: 14px; color: #666; margin-bottom: 20px;"><strong>IP Address:</strong> ${params.ipAddress}</p>` : ''}
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Your account will be automatically unlocked after the lockout period. You can then try logging in again.</p>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">If you don't recognize this activity, please:</p>
              <ul style="font-size: 14px; color: #666; margin-bottom: 20px; padding-left: 20px;">
                <li>Reset your password immediately</li>
                <li>Review your account activity</li>
                <li>Contact our support team</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/forgot-password" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Reset Password</a>
              </div>
              <p style="font-size: 14px; color: #666;">Best regards,<br>The Korella CRM Security Team</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Email verification resend template
 */
export interface EmailVerificationResendParams {
  to: string;
  userName: string;
  verificationLink: string;
}

export async function resendVerificationEmail(params: EmailVerificationResendParams): Promise<{ success: boolean; error?: string }> {
  // Same content as initial verification email
  return sendEmailVerificationEmail(params);
}

// =============================================================================
// Email Service Utilities
// =============================================================================

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Creates a verification link
 */
export function createVerificationLink(token: string): string {
  return `${appUrl}/verify-email?token=${token}`;
}

/**
 * Creates a password reset link
 */
export function createPasswordResetLink(token: string): string {
  return `${appUrl}/reset-password?token=${token}`;
}
