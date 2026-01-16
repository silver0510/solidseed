/**
 * Test Mocks and Stubs
 *
 * Provides mock implementations for external services and dependencies.
 */

import { randomUUID } from 'crypto';
import { TEST_IDS } from './fixtures';

/**
 * Mock email service for testing email-related flows
 */
export const mockEmailService = {
  /** Storage for intercepted emails */
  emails: new Map<string, Array<{ to: string; subject: string; body: string; token?: string }>>(),

  /** Reset the mock email store */
  reset() {
    this.emails.clear();
  },

  /** Find the most recent email sent to an address */
  findLatestEmail(to: string) {
    const emails = this.emails.get(to);
    return emails?.[emails.length - 1];
  },

  /** Find all emails sent to an address */
  findAllEmails(to: string) {
    return this.emails.get(to) || [];
  },

  /** Extract verification token from email body */
  extractVerificationToken(emailBody: string): string | null {
    const match = emailBody.match(/token=([^&\s]+)/);
    return match?.[1] ?? null;
  },

  /** Extract reset token from email body */
  extractResetToken(emailBody: string): string | null {
    const match = emailBody.match(/token=([^&\s]+)/);
    return match?.[1] ?? null;
  },

  /** Mock email template for verification */
  verificationEmail: (to: string, token: string) => ({
    to,
    subject: 'Verify your email',
    body: `Click here to verify: http://localhost:3000/verify-email?token=${token}`,
    token,
  }),

  /** Mock email template for password reset */
  resetEmail: (to: string, token: string) => ({
    to,
    subject: 'Reset your password',
    body: `Click here to reset: http://localhost:3000/reset-password?token=${token}`,
    token,
  }),

  /** Mock email template for lockout notification */
  lockoutEmail: (to: string) => ({
    to,
    subject: 'Account locked',
    body: 'Your account has been locked due to multiple failed login attempts.',
  }),
};

/**
 * Mock OAuth provider responses
 */
export const mockOAuthProviders = {
  google: {
    userInfo: {
      id: 'google-123',
      email: 'test@google.com',
      name: 'Google User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true,
    },
    tokenResponse: {
      access_token: 'mock-google-access-token',
      refresh_token: 'mock-google-refresh-token',
      expires_in: 3600,
    },
  },

  microsoft: {
    userInfo: {
      id: 'microsoft-123',
      email: 'test@microsoft.com',
      name: 'Microsoft User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true,
    },
    tokenResponse: {
      access_token: 'mock-microsoft-access-token',
      refresh_token: 'mock-microsoft-refresh-token',
      expires_in: 3600,
    },
  },
};

/**
 * Mock JWT tokens for testing
 */
export const mockJWT = {
  /** Create a mock JWT payload */
  createPayload: (overrides: {
    userId?: string;
    email?: string;
    subscriptionTier?: string;
    exp?: number;
    iat?: number;
    rememberMe?: boolean;
  } = {}) => {
    const now = Math.floor(Date.now() / 1000);
    return {
      sub: overrides.userId || TEST_IDS.USER_1,
      userId: overrides.userId || TEST_IDS.USER_1,
      email: overrides.email || 'test@example.com',
      name: 'Test User',
      subscriptionTier: overrides.subscriptionTier || 'trial',
      iat: overrides.iat || now,
      exp: overrides.exp || now + 3600,
      rememberMe: overrides.rememberMe || false,
    };
  },

  /** Create a mock expired token payload */
  createExpiredPayload: () => {
    const now = Math.floor(Date.now() / 1000);
    return {
      sub: TEST_IDS.USER_1,
      userId: TEST_IDS.USER_1,
      email: 'test@example.com',
      name: 'Test User',
      subscriptionTier: 'trial',
      iat: now - 7200,
      exp: now - 3600,
    };
  },

  /** Create a mock extended session payload (30 days) */
  createExtendedPayload: () => {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60;
    return {
      sub: TEST_IDS.USER_1,
      userId: TEST_IDS.USER_1,
      email: 'test@example.com',
      name: 'Test User',
      subscriptionTier: 'pro',
      iat: now,
      exp: now + thirtyDays,
      rememberMe: true,
    };
  },
};

/**
 * Mock database responses
 */
export const mockDatabase = {
  /** Mock user record */
  user: (overrides: {
    id?: string;
    email?: string;
    subscription_tier?: string;
    is_deleted?: boolean;
    is_deactivated?: boolean;
    is_locked?: boolean;
    email_verified?: boolean;
  } = {}) => ({
    id: overrides.id || TEST_IDS.USER_1,
    full_name: 'Test User',
    email: overrides.email || 'test@example.com',
    subscription_tier: overrides.subscription_tier || 'trial',
    trial_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_deleted: overrides.is_deleted ?? false,
    is_deactivated: overrides.is_deactivated ?? false,
    is_locked: overrides.is_locked ?? false,
    locked_until: null,
    failed_login_attempts: 0,
    email_verified: overrides.email_verified ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  /** Mock auth log record */
  authLog: (overrides: {
    user_id?: string;
    event_type?: string;
    success?: boolean;
    ip_address?: string;
  } = {}) => ({
    id: TEST_IDS.LOG_1,
    user_id: overrides.user_id || TEST_IDS.USER_1,
    event_type: overrides.event_type || 'login',
    success: overrides.success ?? true,
    ip_address: overrides.ip_address || '127.0.0.1',
    user_agent: 'Test Agent',
    created_at: new Date().toISOString(),
  }),
};

/**
 * Mock rate limiter
 */
export const mockRateLimiter = {
  /** Check if a request should be rate limited */
  isRateLimited: (key: string, limit: number, window: number): boolean => {
    // In tests, we don't actually enforce rate limiting
    // unless specifically testing rate limiting behavior
    return false;
  },

  /** Reset rate limit for a key */
  reset: (key: string): void => {
    // No-op in tests
  },
};

/**
 * Mock time utilities for testing time-sensitive scenarios
 */
export const mockTime = {
  /** Get current timestamp */
  now: () => Date.now(),

  /** Get timestamp X seconds in the future */
  future: (seconds: number) => Date.now() + seconds * 1000,

  /** Get timestamp X seconds in the past */
  past: (seconds: number) => Date.now() - seconds * 1000,

  /** Get Unix timestamp (seconds) */
  unix: () => Math.floor(Date.now() / 1000),

  /** Get Unix timestamp X seconds in the future */
  unixFuture: (seconds: number) => Math.floor(Date.now() / 1000) + seconds,

  /** Get Unix timestamp X seconds in the past */
  unixPast: (seconds: number) => Math.floor(Date.now() / 1000) - seconds,
};
