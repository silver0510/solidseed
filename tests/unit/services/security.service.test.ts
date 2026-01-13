/**
 * Unit Tests: Security Service
 *
 * Tests security functionality:
 * - Account lockout after failed login attempts
 * - Authentication logging
 * - Failed login tracking
 * - Account unlock functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TEST_IDS } from '../../helpers/fixtures';

// =============================================================================
// Mock Setup - Must be before imports
// =============================================================================

// Use vi.hoisted() to define mocks at hoist time
const { mockSql, mockSqlResults } = vi.hoisted(() => {
  const mockSqlResults: any[] = [];
  const mockSql = vi.fn();

  // Configure mockSql to handle both tagged template literals and regular function calls
  mockSql.mockImplementation((...args: any[]) => {
    // If called as template literal (first arg is array of strings)
    if (Array.isArray(args[0]) && args[0].raw) {
      return Promise.resolve(mockSqlResults);
    }
    // If called as regular function for table names: sql(tableName)
    if (typeof args[0] === 'string') {
      return args[0];
    }
    // Default: return promise with results
    return Promise.resolve(mockSqlResults);
  });

  return { mockSql, mockSqlResults };
});

// Mock the @neondatabase/serverless module
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSql),
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id-123'),
}));

// Mock the config module
vi.mock('../../../config/database', () => ({
  authTables: {
    users: 'users',
    oauthProviders: 'oauth_providers',
    passwordResets: 'password_resets',
    emailVerifications: 'email_verifications',
    authLogs: 'auth_logs',
  },
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
}));

// =============================================================================
// Import after mocks are set up
// =============================================================================

import {
  logAuthEvent,
  logLoginSuccess,
  logLoginFailure,
  logLogout,
  logPasswordReset,
  logPasswordChange,
  logAccountLockout,
  checkAccountLockout,
  lockAccount,
  unlockAccount,
  incrementFailedLoginCount,
  resetFailedLoginCount,
  canAttemptLogin,
  purgeOldAuthLogs,
  getUserAuthLogs,
  getRecentFailedLogins,
} from '../../../services/security.service';

// =============================================================================
// Test Helpers
// =============================================================================

function setMockResults(results: any[]) {
  mockSqlResults.length = 0;
  mockSqlResults.push(...results);
}

function clearMockResults() {
  mockSqlResults.length = 0;
}

// =============================================================================
// Tests
// =============================================================================

describe('Security Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMockResults();

    // Set default successful response for INSERT queries
    setMockResults([{
      id: 'mock-id-123',
      user_id: TEST_IDS.USER_1,
      event_type: 'login_success',
      success: true,
      created_at: new Date().toISOString(),
    }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Logging', () => {
    describe('logAuthEvent', () => {
      it('should log authentication event successfully', async () => {
        setMockResults([{
          id: 'mock-id-123',
          user_id: TEST_IDS.USER_1,
          event_type: 'login_success',
          success: true,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          created_at: new Date().toISOString(),
        }]);

        const result = await logAuthEvent({
          userId: TEST_IDS.USER_1,
          eventType: 'login_success',
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        });

        expect(result).toBeDefined();
        expect(result.id).toBe('mock-id-123');
        expect(result.event_type).toBe('login_success');
        expect(mockSql).toHaveBeenCalled();
      });

      it('should log event with optional fields', async () => {
        setMockResults([{
          id: 'mock-id-123',
          user_id: TEST_IDS.USER_1,
          event_type: 'login_fail',
          success: false,
          failure_reason: 'Invalid password',
          target_email: 'test@example.com',
          session_id: 'session-456',
          created_at: new Date().toISOString(),
        }]);

        const result = await logAuthEvent({
          userId: TEST_IDS.USER_1,
          eventType: 'login_fail',
          success: false,
          failureReason: 'Invalid password',
          targetEmail: 'test@example.com',
          sessionId: 'session-456',
        });

        expect(result.failure_reason).toBe('Invalid password');
        expect(result.target_email).toBe('test@example.com');
      });

    });

    describe('logLoginSuccess', () => {
      it('should log successful login without throwing', async () => {
        setMockResults([{ id: 'log-123' }]);

        // This function returns void, so just verify it doesn't throw
        await expect(
          logLoginSuccess(TEST_IDS.USER_1, '192.168.1.1', 'Mozilla/5.0', 'session-456')
        ).resolves.not.toThrow();

        expect(mockSql).toHaveBeenCalled();
      });
    });

    describe('logLoginFailure', () => {
      it('should log failed login attempt without throwing', async () => {
        setMockResults([{ id: 'log-123' }]);

        await expect(
          logLoginFailure('test@example.com', '192.168.1.1', 'Mozilla/5.0', 'Invalid credentials')
        ).resolves.not.toThrow();

        expect(mockSql).toHaveBeenCalled();
      });
    });

    describe('logLogout', () => {
      it('should log logout event without throwing', async () => {
        setMockResults([{ id: 'log-123' }]);

        await expect(
          logLogout(TEST_IDS.USER_1, 'session-456')
        ).resolves.not.toThrow();

        expect(mockSql).toHaveBeenCalled();
      });
    });

    describe('logPasswordReset', () => {
      it('should log password reset event without throwing', async () => {
        setMockResults([{ id: 'log-123' }]);

        await expect(
          logPasswordReset(TEST_IDS.USER_1, '192.168.1.1', 'Mozilla/5.0')
        ).resolves.not.toThrow();

        expect(mockSql).toHaveBeenCalled();
      });
    });

    describe('logPasswordChange', () => {
      it('should log password change event without throwing', async () => {
        setMockResults([{ id: 'log-123' }]);

        await expect(
          logPasswordChange(TEST_IDS.USER_1, '192.168.1.1', 'Mozilla/5.0')
        ).resolves.not.toThrow();

        expect(mockSql).toHaveBeenCalled();
      });
    });

    describe('logAccountLockout', () => {
      it('should log account lockout event without throwing', async () => {
        setMockResults([{ id: 'log-123' }]);

        await expect(
          logAccountLockout(TEST_IDS.USER_1, '192.168.1.1', 5)
        ).resolves.not.toThrow();

        expect(mockSql).toHaveBeenCalled();
      });
    });
  });

  describe('Account Lockout Management', () => {
    describe('checkAccountLockout', () => {
      it('should return not locked for user without lockout', async () => {
        setMockResults([{ locked_until: null, failed_login_count: 0 }]);

        const result = await checkAccountLockout('test@example.com');

        expect(result.isLocked).toBe(false);
        expect(result.lockedUntil).toBeUndefined();
      });

      it('should return locked status for locked account', async () => {
        const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        setMockResults([{ locked_until: futureDate, failed_login_count: 5 }]);

        const result = await checkAccountLockout('test@example.com');

        expect(result.isLocked).toBe(true);
        expect(result.lockedUntil).toBeDefined();
        expect(result.remainingMinutes).toBeGreaterThan(0);
      });

      it('should unlock expired lockout and return not locked', async () => {
        const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
        setMockResults([{ locked_until: pastDate, failed_login_count: 5 }]);

        const result = await checkAccountLockout('test@example.com');

        // Expired lockout should be auto-unlocked
        expect(result.isLocked).toBe(false);
      });

      it('should return not locked for non-existent user', async () => {
        setMockResults([]);

        const result = await checkAccountLockout('nonexistent@example.com');

        expect(result.isLocked).toBe(false);
      });

      it('should lock account when failed count reaches threshold', async () => {
        // User at max failed attempts but not yet locked
        setMockResults([{ locked_until: null, failed_login_count: 5 }]);

        const result = await checkAccountLockout('test@example.com');

        // Should trigger lockout
        expect(result.isLocked).toBe(true);
      });
    });

    describe('lockAccount', () => {
      it('should lock account and return lock details', async () => {
        // First call for UPDATE, second for SELECT failed_login_count, third for log
        setMockResults([{ id: TEST_IDS.USER_1 }]);

        const result = await lockAccount('test@example.com');

        expect(result.isLocked).toBe(true);
        expect(result.lockedUntil).toBeInstanceOf(Date);
      });

      it('should return not locked for non-existent user', async () => {
        setMockResults([]);

        const result = await lockAccount('nonexistent@example.com');

        expect(result.isLocked).toBe(false);
      });
    });

    describe('unlockAccount', () => {
      it('should unlock account successfully', async () => {
        setMockResults([]);

        const result = await unlockAccount('test@example.com');

        expect(result).toBe(true);
        expect(mockSql).toHaveBeenCalled();
      });

    });

    describe('incrementFailedLoginCount', () => {
      it('should increment failed count and return new value', async () => {
        setMockResults([{ failed_login_count: 3 }]);

        const result = await incrementFailedLoginCount('test@example.com');

        expect(result.failedCount).toBe(3);
        expect(result.isLocked).toBe(false);
      });

      it('should lock account when reaching threshold', async () => {
        setMockResults([{ failed_login_count: 5 }]);

        const result = await incrementFailedLoginCount('test@example.com');

        expect(result.failedCount).toBe(5);
        expect(result.isLocked).toBe(true);
        expect(result.lockedUntil).toBeDefined();
      });

      it('should return zero count for non-existent user', async () => {
        setMockResults([]);

        const result = await incrementFailedLoginCount('nonexistent@example.com');

        expect(result.failedCount).toBe(0);
        expect(result.isLocked).toBe(false);
      });
    });

    describe('resetFailedLoginCount', () => {
      it('should reset failed count successfully', async () => {
        setMockResults([]);

        const result = await resetFailedLoginCount(TEST_IDS.USER_1);

        expect(result).toBe(true);
        expect(mockSql).toHaveBeenCalled();
      });
    });

    describe('canAttemptLogin', () => {
      it('should allow login for unlocked account', async () => {
        setMockResults([{ locked_until: null, failed_login_count: 0 }]);

        const result = await canAttemptLogin('test@example.com');

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should deny login for locked account', async () => {
        const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        setMockResults([{ locked_until: futureDate, failed_login_count: 5 }]);

        const result = await canAttemptLogin('test@example.com');

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('locked');
        expect(result.lockedUntil).toBeDefined();
      });
    });
  });

  describe('Auth Log Management', () => {
    describe('purgeOldAuthLogs', () => {
      it('should delete old logs and return count', async () => {
        setMockResults([{ id: 'log-1' }, { id: 'log-2' }, { id: 'log-3' }]);

        const result = await purgeOldAuthLogs();

        expect(result).toBe(3);
      });

      it('should return 0 when no old logs exist', async () => {
        setMockResults([]);

        const result = await purgeOldAuthLogs();

        expect(result).toBe(0);
      });
    });

    describe('getUserAuthLogs', () => {
      it('should return user auth logs', async () => {
        const mockLogs = [
          { id: 'log-1', event_type: 'login_success', created_at: new Date().toISOString() },
          { id: 'log-2', event_type: 'logout', created_at: new Date().toISOString() },
        ];
        setMockResults(mockLogs);

        const result = await getUserAuthLogs(TEST_IDS.USER_1);

        expect(result).toHaveLength(2);
        expect(result[0].event_type).toBe('login_success');
      });

      it('should return empty array for user with no logs', async () => {
        setMockResults([]);

        const result = await getUserAuthLogs(TEST_IDS.USER_1);

        expect(result).toHaveLength(0);
      });
    });

    describe('getRecentFailedLogins', () => {
      it('should return recent failed login attempts', async () => {
        const mockLogs = [
          { id: 'log-1', event_type: 'login_fail', target_email: 'test1@example.com' },
          { id: 'log-2', event_type: 'login_fail', target_email: 'test2@example.com' },
        ];
        setMockResults(mockLogs);

        const result = await getRecentFailedLogins(24);

        expect(result).toHaveLength(2);
      });

      it('should return empty array when no failed logins', async () => {
        setMockResults([]);

        const result = await getRecentFailedLogins();

        expect(result).toHaveLength(0);
      });
    });
  });

  describe('Security Constants', () => {
    it('should use correct max failed attempts', async () => {
      // 5 failed attempts should trigger lockout
      setMockResults([{ failed_login_count: 5 }]);

      const result = await incrementFailedLoginCount('test@example.com');

      expect(result.isLocked).toBe(true);
    });

    it('should use correct lockout duration (30 minutes)', async () => {
      setMockResults([{ id: TEST_IDS.USER_1 }]);

      const result = await lockAccount('test@example.com');

      // Lockout should be ~30 minutes from now
      const expectedMinTime = Date.now() + 29 * 60 * 1000;
      const expectedMaxTime = Date.now() + 31 * 60 * 1000;

      expect(result.lockedUntil.getTime()).toBeGreaterThan(expectedMinTime);
      expect(result.lockedUntil.getTime()).toBeLessThan(expectedMaxTime);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in checkAccountLockout', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database error'));

      const result = await checkAccountLockout('test@example.com');

      // Should return safe default (not locked)
      expect(result.isLocked).toBe(false);
    });
  });
});
