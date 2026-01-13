/**
 * Unit Tests: Auth Service
 *
 * Tests authentication service functions:
 * - Pure helper functions (no DB required)
 * - User status checks
 * - OAuth URL generation
 *
 * Note: Functions that require database interactions (registerUser, loginUser, etc.)
 * need proper Prisma mocking or should be tested as integration tests.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// =============================================================================
// Mock Setup - Must be before imports
// =============================================================================

// Use vi.hoisted() to define mocks at hoist time
const {
  mockPrismaUsers,
  mockPrismaEmailVerifications,
  mockPrismaPasswordResets,
  mockPrismaAuthLogs,
  mockPrismaClient,
  mockBcryptHash,
  mockBcryptCompare,
  mockRandomBytes,
  mockJwtSign,
  mockSendEmailVerificationEmail,
  mockSendPasswordResetEmail,
  mockSendPasswordChangedEmail,
  mockBetterAuth,
} = vi.hoisted(() => {
  const mockPrismaUsers = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockPrismaEmailVerifications = {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const mockPrismaPasswordResets = {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const mockPrismaAuthLogs = {
    findMany: vi.fn(),
    create: vi.fn(),
  };

  const mockPrismaClient = {
    users: mockPrismaUsers,
    email_verifications: mockPrismaEmailVerifications,
    password_resets: mockPrismaPasswordResets,
    auth_logs: mockPrismaAuthLogs,
  };

  const mockBcryptHash = vi.fn();
  const mockBcryptCompare = vi.fn();
  const mockRandomBytes = vi.fn();
  const mockJwtSign = vi.fn();
  const mockSendEmailVerificationEmail = vi.fn();
  const mockSendPasswordResetEmail = vi.fn();
  const mockSendPasswordChangedEmail = vi.fn();

  const mockBetterAuth = {
    api: {
      sendVerificationEmail: vi.fn(),
      getCallbackURL: vi.fn(),
      callbackSocial: vi.fn(),
    },
  };

  return {
    mockPrismaUsers,
    mockPrismaEmailVerifications,
    mockPrismaPasswordResets,
    mockPrismaAuthLogs,
    mockPrismaClient,
    mockBcryptHash,
    mockBcryptCompare,
    mockRandomBytes,
    mockJwtSign,
    mockSendEmailVerificationEmail,
    mockSendPasswordResetEmail,
    mockSendPasswordChangedEmail,
    mockBetterAuth,
  };
});

// Mock pg Pool - use a class to work as constructor
vi.mock('pg', () => ({
  Pool: class MockPool {},
}));

// Mock Prisma adapter - use a class to work as constructor
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class MockPrismaPg {},
}));

// Mock Prisma client - use a class that returns the mock
vi.mock('../../../generated/prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    users = mockPrismaUsers;
    email_verifications = mockPrismaEmailVerifications;
    password_resets = mockPrismaPasswordResets;
    auth_logs = mockPrismaAuthLogs;
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
  },
  hash: mockBcryptHash,
  compare: mockBcryptCompare,
}));

// Mock crypto
vi.mock('crypto', () => ({
  randomBytes: mockRandomBytes,
  default: { randomBytes: mockRandomBytes },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: { sign: mockJwtSign },
  sign: mockJwtSign,
}));

// Mock email service
vi.mock('../../../services/email.service', () => ({
  sendEmailVerificationEmail: mockSendEmailVerificationEmail,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  sendPasswordChangedEmail: mockSendPasswordChangedEmail,
  createVerificationLink: vi.fn((token: string) => `http://localhost:3000/verify-email?token=${token}`),
  createPasswordResetLink: vi.fn((token: string) => `http://localhost:3000/reset-password?token=${token}`),
}));

// Mock Better Auth
vi.mock('../../../lib/auth', () => ({
  auth: mockBetterAuth,
}));

// Mock subscription service
vi.mock('../../../services/subscription.service', () => ({
  checkTrialExpiration: vi.fn((_userId: string, currentTier: string) => currentTier),
}));

// Mock database config
vi.mock('../../../config/database', () => ({
  securityConstants: {
    MAX_FAILED_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 30,
    PASSWORD_RESET_EXPIRATION_HOURS: 1,
    EMAIL_VERIFICATION_EXPIRATION_HOURS: 24,
    AUTH_LOG_RETENTION_DAYS: 7,
    TRIAL_PERIOD_DAYS: 14,
    DEFAULT_JWT_EXPIRATION_DAYS: 3,
    EXTENDED_JWT_EXPIRATION_DAYS: 30,
    BCRYPT_COST_FACTOR: 12,
  },
  authTables: {
    users: 'users',
    oauthProviders: 'oauth_providers',
    passwordResets: 'password_resets',
    emailVerifications: 'email_verifications',
    authLogs: 'auth_logs',
  },
}));

// =============================================================================
// Import after mocks are set up
// =============================================================================

import {
  registerUser,
  verifyEmail,
  loginUser,
  handleOAuthCallback,
  getOAuthAuthorizationURL,
  isAccountLocked,
  getLockExpirationTime,
  canUserAuthenticate,
  getUserSubscriptionStatus,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from '../../../services/auth.service';
import { TEST_IDS } from '../../helpers/fixtures';

// =============================================================================
// Test Helpers
// =============================================================================

function resetAllMocks() {
  // Reset Prisma mocks
  mockPrismaUsers.findFirst.mockReset();
  mockPrismaUsers.create.mockReset();
  mockPrismaUsers.update.mockReset();
  mockPrismaEmailVerifications.findFirst.mockReset();
  mockPrismaEmailVerifications.create.mockReset();
  mockPrismaEmailVerifications.update.mockReset();
  mockPrismaPasswordResets.findFirst.mockReset();
  mockPrismaPasswordResets.create.mockReset();
  mockPrismaPasswordResets.update.mockReset();
  mockPrismaAuthLogs.create.mockReset();

  // Reset other mocks
  mockBcryptHash.mockReset();
  mockBcryptCompare.mockReset();
  mockRandomBytes.mockReset();
  mockJwtSign.mockReset();
  mockSendEmailVerificationEmail.mockReset();
  mockSendPasswordResetEmail.mockReset();
  mockSendPasswordChangedEmail.mockReset();
  mockBetterAuth.api.callbackSocial.mockReset();
}

function createMockUser(overrides = {}) {
  return {
    id: TEST_IDS.USER_1,
    email: 'test@example.com',
    password_hash: 'hashed-password',
    full_name: 'Test User',
    email_verified: true,
    account_status: 'active',
    subscription_tier: 'trial',
    trial_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    failed_login_count: 0,
    locked_until: null,
    is_deleted: false,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    resetAllMocks();

    // Default mock implementations
    mockRandomBytes.mockReturnValue({
      toString: vi.fn(() => 'mock-token-123456789'),
    });
    mockBcryptHash.mockResolvedValue('hashed-password');
    mockJwtSign.mockReturnValue('jwt-token-123');
    mockSendEmailVerificationEmail.mockResolvedValue({ success: true });
    mockSendPasswordResetEmail.mockResolvedValue({ success: true });
    mockSendPasswordChangedEmail.mockResolvedValue({ success: true });
    mockPrismaAuthLogs.create.mockResolvedValue({ id: TEST_IDS.LOG_1 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Pure Helper Functions (No DB Required)
  // ===========================================================================

  describe('isAccountLocked', () => {
    it('should return true for locked account with future date', () => {
      const lockedUser = {
        locked_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      expect(isAccountLocked(lockedUser)).toBe(true);
    });

    it('should return false for unlocked account', () => {
      const unlockedUser = {
        locked_until: null,
      };

      expect(isAccountLocked(unlockedUser)).toBe(false);
    });

    it('should return false for expired lockout', () => {
      const expiredLockUser = {
        locked_until: new Date(Date.now() - 60 * 1000).toISOString(),
      };

      expect(isAccountLocked(expiredLockUser)).toBe(false);
    });
  });

  describe('getLockExpirationTime', () => {
    it('should return minutes for short duration', () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      const result = getLockExpirationTime(futureDate.toISOString());

      expect(result).toMatch(/\d+ minute/);
    });

    it('should return hours for long duration', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const result = getLockExpirationTime(futureDate.toISOString());

      expect(result).toMatch(/\d+ hour/);
    });

    it('should return "now" for expired lockout', () => {
      const pastDate = new Date(Date.now() - 60 * 1000);
      const result = getLockExpirationTime(pastDate.toISOString());

      expect(result).toBe('now');
    });
  });

  describe('canUserAuthenticate', () => {
    it('should allow active verified user', () => {
      const user = createMockUser();
      const result = canUserAuthenticate(user);

      expect(result.canAuthenticate).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny deleted user', () => {
      const user = createMockUser({ is_deleted: true });
      const result = canUserAuthenticate(user);

      expect(result.canAuthenticate).toBe(false);
      expect(result.reason).toContain('deleted');
    });

    it('should deny deactivated user', () => {
      const user = createMockUser({ account_status: 'deactivated' });
      const result = canUserAuthenticate(user);

      expect(result.canAuthenticate).toBe(false);
      expect(result.reason).toContain('deactivated');
    });

    it('should deny locked user', () => {
      const user = createMockUser({
        locked_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      const result = canUserAuthenticate(user);

      expect(result.canAuthenticate).toBe(false);
      expect(result.reason).toContain('locked');
    });

    it('should deny unverified user', () => {
      const user = createMockUser({ email_verified: false });
      const result = canUserAuthenticate(user);

      expect(result.canAuthenticate).toBe(false);
      expect(result.reason).toContain('verified');
    });
  });

  describe('getUserSubscriptionStatus', () => {
    it('should return trial status for trial user', () => {
      const user = createMockUser({
        subscription_tier: 'trial',
        trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const status = getUserSubscriptionStatus(user);

      expect(status.tier).toBe('trial');
      expect(status.isTrial).toBe(true);
      expect(status.isTrialExpired).toBe(false);
      expect(status.daysRemaining).toBeGreaterThan(0);
    });

    it('should return expired status for expired trial', () => {
      const user = createMockUser({
        subscription_tier: 'trial',
        trial_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      const status = getUserSubscriptionStatus(user);

      expect(status.tier).toBe('trial');
      expect(status.isTrial).toBe(true);
      expect(status.isTrialExpired).toBe(true);
      expect(status.daysRemaining).toBe(0);
    });

    it('should return free tier status', () => {
      const user = createMockUser({
        subscription_tier: 'free',
        trial_expires_at: null,
      });

      const status = getUserSubscriptionStatus(user);

      expect(status.tier).toBe('free');
      expect(status.isTrial).toBe(false);
      expect(status.daysRemaining).toBeNull();
    });

    it('should return pro tier status', () => {
      const user = createMockUser({
        subscription_tier: 'pro',
        trial_expires_at: null,
      });

      const status = getUserSubscriptionStatus(user);

      expect(status.tier).toBe('pro');
      expect(status.isTrial).toBe(false);
    });
  });

  describe('getOAuthAuthorizationURL', () => {
    it('should generate Google OAuth URL', () => {
      const url = getOAuthAuthorizationURL('google');

      expect(url).toContain('/api/auth/oauth/google');
    });

    it('should include base URL', () => {
      const url = getOAuthAuthorizationURL('google');

      expect(url).toMatch(/^https?:\/\//);
    });
  });

  // ===========================================================================
  // Database-Dependent Functions
  // ===========================================================================

  describe('registerUser', () => {
    it('should register new user successfully', async () => {
      // Mock no existing user
      mockPrismaUsers.findFirst.mockResolvedValue(null);

      // Mock user creation
      mockPrismaUsers.create.mockResolvedValue(createMockUser({
        id: 'new-user-123',
        email: 'newuser@example.com',
      }));

      // Mock verification creation
      mockPrismaEmailVerifications.create.mockResolvedValue({
        id: 'verification-123',
        token: 'mock-token-123456789',
      });

      const result = await registerUser(
        'newuser@example.com',
        'SecurePass123!',
        'New User',
        '127.0.0.1',
        'TestAgent/1.0'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('email');
      expect(mockPrismaUsers.create).toHaveBeenCalled();
      expect(mockSendEmailVerificationEmail).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      // Mock existing user
      mockPrismaUsers.findFirst.mockResolvedValue(createMockUser());

      const result = await registerUser(
        'existing@example.com',
        'SecurePass123!',
        'Existing User'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });

    it('should reject soft-deleted user email', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(createMockUser({
        is_deleted: true,
      }));

      const result = await registerUser(
        'deleted@example.com',
        'SecurePass123!',
        'Deleted User'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('deleted');
    });

    it('should hash password before storing', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(null);
      mockPrismaUsers.create.mockResolvedValue(createMockUser());
      mockPrismaEmailVerifications.create.mockResolvedValue({ id: 'v-123' });

      await registerUser('new@example.com', 'SecurePass123!', 'New User');

      expect(mockBcryptHash).toHaveBeenCalledWith('SecurePass123!', 12);
    });

    it('should generate verification token', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(null);
      mockPrismaUsers.create.mockResolvedValue(createMockUser());
      mockPrismaEmailVerifications.create.mockResolvedValue({ id: 'v-123' });

      await registerUser('new@example.com', 'SecurePass123!', 'New User');

      expect(mockRandomBytes).toHaveBeenCalledWith(32);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const mockVerification = {
        id: 'verification-123',
        user_id: TEST_IDS.USER_1,
        token: 'valid-token',
        verified: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        users: { email_verified: false, account_status: 'pending' },
      };

      mockPrismaEmailVerifications.findFirst.mockResolvedValue(mockVerification);
      mockPrismaUsers.update.mockResolvedValue(createMockUser());
      mockPrismaEmailVerifications.update.mockResolvedValue({ ...mockVerification, verified: true });

      const result = await verifyEmail('valid-token');

      expect(result.success).toBe(true);
      expect(result.redirect).toBe('/login');
    });

    it('should reject invalid token', async () => {
      mockPrismaEmailVerifications.findFirst.mockResolvedValue(null);

      const result = await verifyEmail('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should reject expired token', async () => {
      const mockVerification = {
        id: 'verification-123',
        user_id: TEST_IDS.USER_1,
        token: 'expired-token',
        verified: false,
        expires_at: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
        users: { email_verified: false, account_status: 'pending' },
      };

      mockPrismaEmailVerifications.findFirst.mockResolvedValue(mockVerification);

      const result = await verifyEmail('expired-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('should handle already verified token', async () => {
      const mockVerification = {
        id: 'verification-123',
        user_id: TEST_IDS.USER_1,
        token: 'already-verified',
        verified: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        users: { email_verified: true, account_status: 'active' },
      };

      mockPrismaEmailVerifications.findFirst.mockResolvedValue(mockVerification);

      const result = await verifyEmail('already-verified');

      expect(result.success).toBe(true);
      expect(result.message).toContain('already verified');
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = createMockUser();
      mockPrismaUsers.findFirst.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockPrismaUsers.update.mockResolvedValue(mockUser);

      const result = await loginUser(
        'test@example.com',
        'ValidPass123!',
        false,
        '127.0.0.1',
        'TestAgent/1.0'
      );

      expect(result.success).toBe(true);
      expect(result.token).toBe('jwt-token-123');
      expect(result.user).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(null);

      const result = await loginUser(
        'nonexistent@example.com',
        'WrongPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should reject wrong password', async () => {
      const mockUser = createMockUser();
      mockPrismaUsers.findFirst.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);
      mockPrismaUsers.update.mockResolvedValue({ ...mockUser, failed_login_count: 1 });

      const result = await loginUser(
        'test@example.com',
        'WrongPassword123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should reject locked account', async () => {
      const mockUser = createMockUser({
        locked_until: new Date(Date.now() + 30 * 60 * 1000),
      });
      mockPrismaUsers.findFirst.mockResolvedValue(mockUser);

      const result = await loginUser(
        'locked@example.com',
        'ValidPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('locked');
    });

    it('should reject unverified email', async () => {
      const mockUser = createMockUser({ email_verified: false });
      mockPrismaUsers.findFirst.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);

      const result = await loginUser(
        'unverified@example.com',
        'ValidPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('verify');
    });

    it('should use correct JWT expiration for regular login', async () => {
      const mockUser = createMockUser();
      mockPrismaUsers.findFirst.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockPrismaUsers.update.mockResolvedValue(mockUser);

      await loginUser('test@example.com', 'ValidPass123!', false);

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: '3d' }
      );
    });

    it('should use extended JWT expiration for remember me', async () => {
      const mockUser = createMockUser();
      mockPrismaUsers.findFirst.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockPrismaUsers.update.mockResolvedValue(mockUser);

      await loginUser('test@example.com', 'ValidPass123!', true);

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: '30d' }
      );
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle successful Google OAuth callback', async () => {
      mockBetterAuth.api.callbackSocial.mockResolvedValue({
        user: {
          id: 'google-user-123',
          email: 'googleuser@example.com',
          name: 'Google User',
        },
        session: {
          token: 'oauth-jwt-token',
        },
      });

      const result = await handleOAuthCallback(
        'google',
        'google-auth-code',
        'state-123'
      );

      expect(result.success).toBe(true);
      expect(result.token).toBe('oauth-jwt-token');
      expect(result.user).toBeDefined();
    });

    it('should handle OAuth errors', async () => {
      mockBetterAuth.api.callbackSocial.mockResolvedValue({
        error: { message: 'OAuth failed' },
      });

      const result = await handleOAuthCallback('google', 'invalid-code');

      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });

    it('should handle missing user data', async () => {
      mockBetterAuth.api.callbackSocial.mockResolvedValue({
        user: null,
        session: null,
      });

      const result = await handleOAuthCallback('google', 'code', 'state');

      expect(result.success).toBe(false);
    });
  });

  describe('requestPasswordReset', () => {
    it('should send reset email for valid user', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(createMockUser());
      mockPrismaPasswordResets.create.mockResolvedValue({
        id: 'reset-123',
        token: 'reset-token',
      });

      const result = await requestPasswordReset('test@example.com');

      expect(result.success).toBe(true);
      expect(mockSendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should not reveal if email exists', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(null);

      const result = await requestPasswordReset('nonexistent@example.com');

      // Should still return success for security
      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const mockReset = {
        id: 'reset-123',
        user_id: TEST_IDS.USER_1,
        token: 'valid-reset-token',
        used: false,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
        users: createMockUser(),
      };

      mockPrismaPasswordResets.findFirst.mockResolvedValue(mockReset);
      mockPrismaUsers.update.mockResolvedValue(createMockUser());
      mockPrismaPasswordResets.update.mockResolvedValue({ ...mockReset, used: true });

      const result = await resetPassword('valid-reset-token', 'NewPassword123!');

      expect(result.success).toBe(true);
      expect(mockBcryptHash).toHaveBeenCalled();
      expect(mockSendPasswordChangedEmail).toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockPrismaPasswordResets.findFirst.mockResolvedValue(null);

      const result = await resetPassword('invalid-token', 'NewPassword123!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });
  });

  describe('changePassword', () => {
    it('should change password with correct current password', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(createMockUser());
      mockBcryptCompare
        .mockResolvedValueOnce(true)  // Current password check
        .mockResolvedValueOnce(false); // New password != current check
      mockPrismaUsers.update.mockResolvedValue(createMockUser());

      const result = await changePassword(
        TEST_IDS.USER_1,
        'CurrentPassword123!',
        'NewPassword456!'
      );

      expect(result.success).toBe(true);
      expect(mockSendPasswordChangedEmail).toHaveBeenCalled();
    });

    it('should reject incorrect current password', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(createMockUser());
      mockBcryptCompare.mockResolvedValue(false);

      const result = await changePassword(
        TEST_IDS.USER_1,
        'WrongPassword123!',
        'NewPassword456!'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('incorrect');
    });

    it('should reject same password as current', async () => {
      mockPrismaUsers.findFirst.mockResolvedValue(createMockUser());
      mockBcryptCompare
        .mockResolvedValueOnce(true)  // Current password check
        .mockResolvedValueOnce(true); // New password == current check

      const result = await changePassword(
        TEST_IDS.USER_1,
        'SamePassword123!',
        'SamePassword123!'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('different');
    });
  });
});
