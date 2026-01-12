/**
 * Unit Tests: Email Service
 *
 * Tests email sending functionality:
 * - Email verification
 * - Password reset
 * - Password changed notification
 * - Account lockout alert
 * - Email validation
 * - Link generation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// =============================================================================
// Mock Setup - Must be before imports
// =============================================================================

// Create a mock send function that we can control in tests
const mockSend = vi.fn();

// Mock the Resend module with a proper class mock
vi.mock('resend', () => {
  // Return a class mock that works with the `new` keyword
  return {
    Resend: class MockResend {
      emails = {
        send: mockSend,
      };
    },
  };
});

// =============================================================================
// Import after mocks are set up
// =============================================================================

import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendAccountLockoutAlertEmail,
  resendVerificationEmail,
  isValidEmail,
  createVerificationLink,
  createPasswordResetLink,
  validateEmailConfig,
} from '../../../services/email.service';

// =============================================================================
// Tests
// =============================================================================

describe('Email Service Unit Tests', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockSend.mockReset();

    // Set up default successful response
    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.org',
        'user_name@example.io',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('  ')).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
    });
  });

  describe('Link Generation', () => {
    it('should create verification link', () => {
      const token = 'verify-token-123';
      const link = createVerificationLink(token);

      expect(link).toContain('/verify-email?token=verify-token-123');
    });

    it('should create password reset link', () => {
      const token = 'reset-token-456';
      const link = createPasswordResetLink(token);

      expect(link).toContain('/reset-password?token=reset-token-456');
    });

    it('should include base URL in links', () => {
      const token = 'token-789';

      const verifyLink = createVerificationLink(token);
      expect(verifyLink).toMatch(/^https?:\/\/.+\/verify-email\?token=/);

      const resetLink = createPasswordResetLink(token);
      expect(resetLink).toMatch(/^https?:\/\/.+\/reset-password\?token=/);
    });

    it('should properly include token in links', () => {
      const token = 'special-token-abc123';
      const link = createVerificationLink(token);

      expect(link).toContain(`token=${token}`);
    });
  });

  describe('Email Verification Email', () => {
    it('should send email verification email successfully', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const result = await sendEmailVerificationEmail({
        to: 'user@example.com',
        userName: 'Test User',
        verificationLink: 'http://localhost:3000/verify-email?token=abc123',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Verify Your Email Address - Korella CRM',
        })
      );
    });

    it('should handle Resend API errors', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'API error' },
      });

      const result = await sendEmailVerificationEmail({
        to: 'user@example.com',
        userName: 'Test User',
        verificationLink: 'http://localhost:3000/verify-email?token=abc123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
    });

    it('should handle network errors', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      const result = await sendEmailVerificationEmail({
        to: 'user@example.com',
        userName: 'Test User',
        verificationLink: 'http://localhost:3000/verify-email?token=abc123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should include verification link in email body', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const verificationLink = 'http://localhost:3000/verify-email?token=abc123';
      await sendEmailVerificationEmail({
        to: 'user@example.com',
        userName: 'Test User',
        verificationLink,
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain(verificationLink);
    });

    it('should include user name in email body', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      await sendEmailVerificationEmail({
        to: 'user@example.com',
        userName: 'John Doe',
        verificationLink: 'http://localhost:3000/verify-email?token=abc123',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('John Doe');
    });
  });

  describe('Password Reset Email', () => {
    it('should send password reset email successfully', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-456' },
        error: null,
      });

      const result = await sendPasswordResetEmail({
        to: 'user@example.com',
        userName: 'Test User',
        resetLink: 'http://localhost:3000/reset-password?token=xyz789',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Reset Your Password - Korella CRM',
        })
      );
    });

    it('should include reset link in email body', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-456' },
        error: null,
      });

      const resetLink = 'http://localhost:3000/reset-password?token=xyz789';
      await sendPasswordResetEmail({
        to: 'user@example.com',
        userName: 'Test User',
        resetLink,
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain(resetLink);
    });

    it('should mention 1-hour expiration in email', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-456' },
        error: null,
      });

      await sendPasswordResetEmail({
        to: 'user@example.com',
        userName: 'Test User',
        resetLink: 'http://localhost:3000/reset-password?token=xyz789',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('1 hour');
    });

    it('should handle API errors gracefully', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      });

      const result = await sendPasswordResetEmail({
        to: 'user@example.com',
        userName: 'Test User',
        resetLink: 'http://localhost:3000/reset-password?token=xyz789',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('Password Changed Email', () => {
    it('should send password changed notification', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-789' },
        error: null,
      });

      const changedAt = new Date('2024-01-15T10:30:00Z');
      const result = await sendPasswordChangedEmail({
        to: 'user@example.com',
        userName: 'Test User',
        changedAt,
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Password Changed Successfully - Korella CRM',
        })
      );
    });

    it('should include change timestamp in email', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-789' },
        error: null,
      });

      const changedAt = new Date('2024-01-15T10:30:00Z');
      await sendPasswordChangedEmail({
        to: 'user@example.com',
        userName: 'Test User',
        changedAt,
      });

      const callArgs = mockSend.mock.calls[0][0];
      // Check that the email contains some form of the date
      expect(callArgs.html).toContain('2024');
    });

    it('should handle errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Connection timeout'));

      const result = await sendPasswordChangedEmail({
        to: 'user@example.com',
        userName: 'Test User',
        changedAt: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });
  });

  describe('Account Lockout Alert Email', () => {
    it('should send lockout alert email', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-999' },
        error: null,
      });

      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      const result = await sendAccountLockoutAlertEmail({
        to: 'user@example.com',
        userName: 'Test User',
        lockedUntil,
        ipAddress: '192.168.1.1',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Security Alert: Account Locked - Korella CRM',
        })
      );
    });

    it('should include IP address when provided', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-999' },
        error: null,
      });

      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await sendAccountLockoutAlertEmail({
        to: 'user@example.com',
        userName: 'Test User',
        lockedUntil,
        ipAddress: '192.168.1.1',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('192.168.1.1');
    });

    it('should not include IP address section when not provided', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-999' },
        error: null,
      });

      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await sendAccountLockoutAlertEmail({
        to: 'user@example.com',
        userName: 'Test User',
        lockedUntil,
      });

      const callArgs = mockSend.mock.calls[0][0];
      // Should not have the IP address section
      expect(callArgs.html).not.toContain('IP Address');
    });

    it('should include lockout time in email', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-999' },
        error: null,
      });

      const lockedUntil = new Date('2024-01-15T12:00:00Z');
      await sendAccountLockoutAlertEmail({
        to: 'user@example.com',
        userName: 'Test User',
        lockedUntil,
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('Account locked until');
    });
  });

  describe('Resend Verification Email', () => {
    it('should call sendEmailVerificationEmail internally', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const result = await resendVerificationEmail({
        to: 'user@example.com',
        userName: 'Test User',
        verificationLink: 'http://localhost:3000/verify-email?token=abc123',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('Email Configuration Validation', () => {
    const originalEnv = process.env.RESEND_API_KEY;

    afterEach(() => {
      // Restore original env
      if (originalEnv) {
        process.env.RESEND_API_KEY = originalEnv;
      }
    });

    it('should throw error when RESEND_API_KEY is missing', () => {
      const savedKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      expect(() => validateEmailConfig()).toThrow('RESEND_API_KEY');

      // Restore
      process.env.RESEND_API_KEY = savedKey;
    });

    it('should not throw error when all required config is present', () => {
      process.env.RESEND_API_KEY = 'test-api-key';

      expect(() => validateEmailConfig()).not.toThrow();
    });
  });

  describe('Email Template Consistency', () => {
    it('should use consistent branding across all emails', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      // Send verification email
      await sendEmailVerificationEmail({
        to: 'user@example.com',
        userName: 'Test User',
        verificationLink: 'http://localhost:3000/verify-email?token=abc',
      });

      const verificationCall = mockSend.mock.calls[0][0];

      // All emails should contain Korella CRM branding
      expect(verificationCall.html).toContain('Korella CRM');
    });

    it('should include team signature in transactional emails', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      await sendPasswordResetEmail({
        to: 'user@example.com',
        userName: 'Test User',
        resetLink: 'http://localhost:3000/reset-password?token=xyz',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('Korella CRM Team');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown error types', async () => {
      mockSend.mockRejectedValue('string error');

      const result = await sendEmailVerificationEmail({
        to: 'user@example.com',
        userName: 'Test User',
        verificationLink: 'http://localhost:3000/verify-email?token=abc123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });

    it('should handle null error from API', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await sendEmailVerificationEmail({
        to: 'user@example.com',
        userName: 'Test User',
        verificationLink: 'http://localhost:3000/verify-email?token=abc123',
      });

      // When both data and error are null, it should still be considered success
      // based on the implementation (no error means success)
      expect(result.success).toBe(true);
    });
  });
});
