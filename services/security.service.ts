/**
 * Security Service for Korella CRM
 *
 * This module handles security-related operations including:
 * - Account lockout after failed login attempts
 * - Authentication logging to auth_logs table
 * - Security event tracking and monitoring
 *
 * Environment Variables Required:
 * - SUPABASE_DATABASE_URL: PostgreSQL connection string
 */

import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';
import {
  authTables,
  securityConstants,
  type AuthEventType,
  type AuthLog,
} from '../config/database';

// =============================================================================
// Database Configuration
// =============================================================================

/**
 * PostgreSQL connection string from Supabase
 */
const databaseUrl = process.env.SUPABASE_DATABASE_URL || '';

if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL environment variable is required');
}

/**
 * Neon database client for PostgreSQL
 */
const sql = neon(databaseUrl);

// =============================================================================
// Authentication Logging
// =============================================================================

/**
 * Logs an authentication event to the auth_logs table
 *
 * @param params - Authentication event parameters
 * @returns Created log record
 */
export async function logAuthEvent(params: {
  userId?: string;
  eventType: AuthEventType;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  targetEmail?: string;
  success: boolean;
  failureReason?: string;
  eventDetails?: Record<string, unknown>;
}): Promise<AuthLog> {
  const id = nanoid();
  const createdAt = new Date().toISOString();

  try {
    const result = await sql`
      INSERT INTO ${sql(authTables.authLogs)} (
        id,
        user_id,
        event_type,
        event_details,
        ip_address,
        user_agent,
        session_id,
        target_email,
        success,
        failure_reason,
        created_at
      ) VALUES (
        ${id},
        ${params.userId || null},
        ${params.eventType},
        ${params.eventDetails ? JSON.stringify(params.eventDetails) : null},
        ${params.ipAddress || null},
        ${params.userAgent || null},
        ${params.sessionId || null},
        ${params.targetEmail || null},
        ${params.success},
        ${params.failureReason || null},
        ${createdAt}
      )
      RETURNING *
    `;

    return result[0] as AuthLog;
  } catch (error) {
    console.error('Failed to log auth event:', error);
    // Don't throw - logging failures shouldn't break auth flows
    throw error;
  }
}

/**
 * Logs a successful login event
 *
 * @param userId - User ID
 * @param ipAddress - IP address of the login attempt
 * @param userAgent - User agent string
 * @param sessionId - Session ID
 */
export async function logLoginSuccess(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  sessionId?: string
): Promise<void> {
  await logAuthEvent({
    userId,
    eventType: 'login_success',
    ipAddress,
    userAgent,
    sessionId,
    success: true,
  });
}

/**
 * Logs a failed login attempt
 *
 * @param email - Email address that was used
 * @param ipAddress - IP address of the login attempt
 * @param userAgent - User agent string
 * @param failureReason - Reason for failure
 */
export async function logLoginFailure(
  email: string,
  ipAddress?: string,
  userAgent?: string,
  failureReason?: string
): Promise<void> {
  await logAuthEvent({
    eventType: 'login_fail',
    targetEmail: email,
    ipAddress,
    userAgent,
    success: false,
    failureReason,
  });
}

/**
 * Logs a logout event
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 */
export async function logLogout(userId: string, sessionId?: string): Promise<void> {
  await logAuthEvent({
    userId,
    eventType: 'logout',
    sessionId,
    success: true,
  });
}

/**
 * Logs a password reset event
 *
 * @param userId - User ID
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent string
 */
export async function logPasswordReset(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent({
    userId,
    eventType: 'password_reset_complete',
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Logs a password change event
 *
 * @param userId - User ID
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent string
 */
export async function logPasswordChange(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent({
    userId,
    eventType: 'password_change',
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Logs an account lockout event
 *
 * @param userId - User ID
 * @param ipAddress - IP address of the login attempts
 * @param failedAttempts - Number of failed attempts
 */
export async function logAccountLockout(
  userId: string,
  ipAddress?: string,
  failedAttempts?: number
): Promise<void> {
  await logAuthEvent({
    userId,
    eventType: 'account_lockout',
    ipAddress,
    success: false,
    failureReason: `Account locked after ${failedAttempts} failed login attempts`,
    eventDetails: {
      failedAttempts,
      lockoutDurationMinutes: securityConstants.LOCKOUT_DURATION_MINUTES,
    },
  });
}

// =============================================================================
// Account Lockout Management
// =============================================================================

/**
 * Checks if a user's account is currently locked
 *
 * @param email - User email address
 * @returns Object with lock status and details
 */
export async function checkAccountLockout(
  email: string
): Promise<{
  isLocked: boolean;
  lockedUntil?: Date;
  remainingMinutes?: number;
}> {
  try {
    const result = await sql`
      SELECT locked_until, failed_login_count
      FROM ${sql(authTables.users)}
      WHERE email = ${email}
        AND is_deleted = false
    `;

    if (!result || result.length === 0) {
      return { isLocked: false };
    }

    const user = result[0] as { locked_until: string | null; failed_login_count: number };

    // Check if account is locked
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      const now = new Date();

      if (lockedUntil > now) {
        // Account is still locked
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return {
          isLocked: true,
          lockedUntil,
          remainingMinutes,
        };
      } else {
        // Lockout period has expired, unlock the account
        await unlockAccount(email);
        return { isLocked: false };
      }
    }

    // Check if failed login count is at the threshold
    if (user.failed_login_count >= securityConstants.MAX_FAILED_LOGIN_ATTEMPTS) {
      // Lock the account
      return await lockAccount(email);
    }

    return { isLocked: false };
  } catch (error) {
    console.error('Error checking account lockout:', error);
    return { isLocked: false };
  }
}

/**
 * Locks a user account after failed login attempts
 *
 * @param email - User email address
 * @returns Lock status
 */
export async function lockAccount(
  email: string
): Promise<{
  isLocked: boolean;
  lockedUntil: Date;
  userId?: string;
}> {
  const lockedUntil = new Date();
  lockedUntil.setMinutes(lockedUntil.getMinutes() + securityConstants.LOCKOUT_DURATION_MINUTES);

  try {
    const result = await sql`
      UPDATE ${sql(authTables.users)}
      SET locked_until = ${lockedUntil.toISOString()},
          updated_at = ${new Date().toISOString()}
      WHERE email = ${email}
        AND is_deleted = false
      RETURNING id
    `;

    if (!result || result.length === 0) {
      return { isLocked: false, lockedUntil };
    }

    const userId = (result[0] as { id: string }).id;

    // Log the lockout event
    const userResult = await sql`
      SELECT failed_login_count FROM ${sql(authTables.users)} WHERE id = ${userId}
    `;
    const failedAttempts = userResult[0]?.failed_login_count || 0;

    await logAccountLockout(userId, undefined, failedAttempts);

    return {
      isLocked: true,
      lockedUntil,
      userId,
    };
  } catch (error) {
    console.error('Error locking account:', error);
    return { isLocked: false, lockedUntil };
  }
}

/**
 * Unlocks a user account
 *
 * @param email - User email address
 * @returns Success status
 */
export async function unlockAccount(email: string): Promise<boolean> {
  try {
    await sql`
      UPDATE ${sql(authTables.users)}
      SET locked_until = NULL,
          failed_login_count = 0,
          updated_at = ${new Date().toISOString()}
      WHERE email = ${email}
        AND is_deleted = false
    `;

    // Log the unlock event
    await logAuthEvent({
      eventType: 'account_unlock',
      targetEmail: email,
      success: true,
    });

    return true;
  } catch (error) {
    console.error('Error unlocking account:', error);
    return false;
  }
}

/**
 * Increments failed login count for a user
 *
 * @param email - User email address
 * @returns Updated failed login count and lock status
 */
export async function incrementFailedLoginCount(
  email: string
): Promise<{
  failedCount: number;
  isLocked: boolean;
  lockedUntil?: Date;
}> {
  try {
    const result = await sql`
      UPDATE ${sql(authTables.users)}
      SET failed_login_count = failed_login_count + 1,
          updated_at = ${new Date().toISOString()}
      WHERE email = ${email}
        AND is_deleted = false
      RETURNING failed_login_count
    `;

    if (!result || result.length === 0) {
      return { failedCount: 0, isLocked: false };
    }

    const failedCount = (result[0] as { failed_login_count: number }).failed_login_count;

    // Check if we need to lock the account
    if (failedCount >= securityConstants.MAX_FAILED_LOGIN_ATTEMPTS) {
      const lockResult = await lockAccount(email);
      return {
        failedCount,
        isLocked: true,
        lockedUntil: lockResult.lockedUntil,
      };
    }

    return { failedCount, isLocked: false };
  } catch (error) {
    console.error('Error incrementing failed login count:', error);
    return { failedCount: 0, isLocked: false };
  }
}

/**
 * Resets failed login count for a user (after successful login)
 *
 * @param userId - User ID
 * @returns Success status
 */
export async function resetFailedLoginCount(userId: string): Promise<boolean> {
  try {
    await sql`
      UPDATE ${sql(authTables.users)}
      SET failed_login_count = 0,
          locked_until = NULL,
          updated_at = ${new Date().toISOString()}
      WHERE id = ${userId}
        AND is_deleted = false
    `;

    return true;
  } catch (error) {
    console.error('Error resetting failed login count:', error);
    return false;
  }
}

/**
 * Checks if a login attempt should be allowed based on account status
 *
 * @param email - User email address
 * @returns Object indicating if login is allowed and reason if not
 */
export async function canAttemptLogin(
  email: string
): Promise<{
  allowed: boolean;
  reason?: string;
  lockedUntil?: Date;
}> {
  // Check if account is locked
  const lockoutStatus = await checkAccountLockout(email);

  if (lockoutStatus.isLocked) {
    return {
      allowed: false,
      reason: `Account is locked. Try again in ${lockoutStatus.remainingMinutes} minutes.`,
      lockedUntil: lockoutStatus.lockedUntil,
    };
  }

  return { allowed: true };
}

// =============================================================================
// Auth Log Cleanup
// =============================================================================

/**
 * Deletes authentication logs older than the retention period
 * (7 days by default)
 *
 * @returns Number of logs deleted
 */
export async function purgeOldAuthLogs(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - securityConstants.AUTH_LOG_RETENTION_DAYS);

  try {
    const result = await sql`
      DELETE FROM ${sql(authTables.authLogs)}
      WHERE created_at < ${cutoffDate.toISOString()}
      RETURNING id
    `;

    const deletedCount = result.length;

    console.log(`Purged ${deletedCount} auth logs older than ${securityConstants.AUTH_LOG_RETENTION_DAYS} days`);

    return deletedCount;
  } catch (error) {
    console.error('Error purging old auth logs:', error);
    return 0;
  }
}

/**
 * Gets authentication logs for a specific user
 *
 * @param userId - User ID
 * @param limit - Maximum number of logs to return
 * @returns Array of auth logs
 */
export async function getUserAuthLogs(
  userId: string,
  limit: number = 50
): Promise<AuthLog[]> {
  try {
    const result = await sql`
      SELECT *
      FROM ${sql(authTables.authLogs)}
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result as AuthLog[];
  } catch (error) {
    console.error('Error getting user auth logs:', error);
    return [];
  }
}

/**
 * Gets recent failed login attempts for security monitoring
 *
 * @param hours - Number of hours to look back
 * @param limit - Maximum number of logs to return
 * @returns Array of failed login logs
 */
export async function getRecentFailedLogins(
  hours: number = 24,
  limit: number = 100
): Promise<AuthLog[]> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);

  try {
    const result = await sql`
      SELECT *
      FROM ${sql(authTables.authLogs)}
      WHERE event_type = 'login_fail'
        AND created_at > ${cutoffDate.toISOString()}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result as AuthLog[];
  } catch (error) {
    console.error('Error getting recent failed logins:', error);
    return [];
  }
}
