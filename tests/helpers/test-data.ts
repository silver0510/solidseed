/**
 * Test Data Helpers
 *
 * Provides test user data generation and test fixtures for authentication tests.
 */

import { randomInt } from 'crypto';

/**
 * Valid test user data that meets all requirements
 */
export const testUser = {
  full_name: 'Test User',
  email: `test-${randomInt(100000, 999999)}@example.com`,
  password: 'TestPassword123!',
  weak_passwords: [
    'short', // Too short
    'nouppercase123!', // No uppercase
    'NOLOWERCASE123!', // No lowercase
    'NoNumber!', // No number
    'NoSymbol123', // No symbol
  ],
};

/**
 * Generate a unique test email address
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = randomInt(1000, 9999);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate a valid test password
 */
export function generateTestPassword(): string {
  const adjectives = ['Strong', 'Secure', 'Valid', 'Test', 'Demo'];
  const nouns = ['Password', 'Pass', 'Secret', 'Key', 'Token'];
  const numbers = randomInt(100, 999);

  const adj = adjectives[randomInt(0, adjectives.length)];
  const noun = nouns[randomInt(0, nouns.length)];

  return `${adj}${noun}${numbers}!`;
}

/**
 * Test user types for different scenarios
 */
export const testUsers = {
  /** Standard verified user */
  standard: () => ({
    full_name: 'Standard User',
    email: generateTestEmail(),
    password: 'StandardPass123!',
  }),

  /** User with trial subscription */
  trial: () => ({
    full_name: 'Trial User',
    email: generateTestEmail(),
    password: 'TrialPass123!',
  }),

  /** User with pro subscription */
  pro: () => ({
    full_name: 'Pro User',
    email: generateTestEmail(),
    password: 'ProPass123!',
  }),

  /** User with enterprise subscription */
  enterprise: () => ({
    full_name: 'Enterprise User',
    email: generateTestEmail(),
    password: 'EnterprisePass123!',
  }),
};

/**
 * OAuth test data
 */
export const oauthTestData = {
  google: {
    provider: 'google',
    code: 'test-google-oauth-code',
    state: 'test-state',
  },
  microsoft: {
    provider: 'microsoft',
    code: 'test-microsoft-oauth-code',
    state: 'test-state',
  },
};

/**
 * Test tokens for various scenarios
 */
export const testTokens = {
  /** Valid JWT token (mock) */
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',

  /** Expired JWT token */
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid',

  /** Malformed JWT token */
  malformed: 'not.a.valid.jwt',

  /** Empty token */
  empty: '',

  /** Test email verification token */
  emailVerification: () => `verify-${randomInt(100000, 999999)}-${Date.now()}`,

  /** Test password reset token */
  passwordReset: () => `reset-${randomInt(100000, 999999)}-${Date.now()}`,
};

/**
 * API response mock helpers
 */
export const mockResponses = {
  success: (data: unknown) => ({
    ok: true,
    status: 200,
    json: async () => data,
  }),

  error: (message: string, status = 400) => ({
    ok: false,
    status,
    json: async () => ({ error: message }),
  }),

  unauthorized: () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  }),

  rateLimited: () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: 'Too many requests' }),
  }),
};

/**
 * Test timeout constants
 */
export const testTimeouts = {
  default: 5000,
  api: 10000,
  slow: 30000,
  oauth: 15000,
};

/**
 * Test user states
 */
export const userStates = {
  active: {
    is_deleted: false,
    is_deactivated: false,
    is_locked: false,
    locked_until: null,
    email_verified: true,
  },

  unverified: {
    is_deleted: false,
    is_deactivated: false,
    is_locked: false,
    locked_until: null,
    email_verified: false,
  },

  locked: {
    is_deleted: false,
    is_deactivated: false,
    is_locked: true,
    locked_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    email_verified: true,
  },

  deactivated: {
    is_deleted: false,
    is_deactivated: true,
    is_locked: false,
    locked_until: null,
    email_verified: true,
  },

  deleted: {
    is_deleted: true,
    is_deactivated: false,
    is_locked: false,
    locked_until: null,
    email_verified: true,
  },
};
