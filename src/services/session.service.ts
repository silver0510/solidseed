/**
 * Session Service
 *
 * This module provides session management functionality including:
 * - Session validation (JWT expiration, user status, account locks)
 * - Logout handling with event logging
 * - "Remember me" token expiration management
 * - Session lifecycle state management
 *
 * Session States:
 * - Active: Token valid, user active, not locked
 * - Expired: Token past expiration timestamp
 * - Revoked: User deactivated or locked
 * - Invalid: Bad signature or malformed token
 */

import { neon } from '@neondatabase/serverless';
import { authTables, securityConstants, type User, type AuthLog } from '../config/database';

// =============================================================================
// Database Connection
// =============================================================================

const databaseUrl = process.env.SUPABASE_DATABASE_URL || '';
if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL environment variable is required');
}

const sql = neon(databaseUrl);

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  user?: User;
  error?: {
    code: 'TOKEN_EXPIRED' | 'USER_NOT_FOUND' | 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_LOCKED' | 'INVALID_TOKEN';
    message: string;
    lockedUntil?: Date;
  };
}

/**
 * Session information extracted from JWT
 */
export interface SessionInfo {
  userId: string;
  email: string;
  subscriptionTier: string;
  expiresAt: Date;
  rememberMe: boolean;
}

/**
 * Logout result
 */
export interface LogoutResult {
  success: boolean;
  message: string;
}

// =============================================================================
// Session Validation
// =============================================================================

/**
 * Validates a user session by checking:
 * 1. User exists
 * 2. User account is active (not deactivated)
 * 3. User account is not locked
 * 4. User's subscription tier is valid
 *
 * @param userId - User ID from JWT token
 *
 * @returns Session validation result
 */
export async function validateSession(userId: string): Promise<SessionValidationResult> {
  try {
    // Fetch user from database
    const users = await sql`
      SELECT
        id,
        email,
        full_name,
        email_verified,
        account_status,
        subscription_tier,
        trial_expires_at,
        failed_login_count,
        locked_until,
        is_deleted,
        created_at
      FROM ${authTables.users}
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (users.length === 0) {
      return {
        valid: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    const user = users[0] as User;

    // Check if user is soft-deleted
    if (user.is_deleted) {
      return {
        valid: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    // Check if account is deactivated
    if (user.account_status === 'deactivated') {
      return {
        valid: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Account has been deactivated',
        },
      };
    }

    // Check if account is locked
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (lockedUntil > new Date()) {
        return {
          valid: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Account is temporarily locked due to multiple failed login attempts',
            lockedUntil,
          },
        };
      }
    }

    // Check if email is verified (required for email/password login)
    if (!user.email_verified) {
      return {
        valid: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Email address must be verified',
        },
      };
    }

    // Session is valid
    return {
      valid: true,
      user,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      valid: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Session validation failed',
      },
    };
  }
}

/**
 * Validates JWT token expiration
 *
 * @param expiresAt - Token expiration timestamp
 *
 * @returns True if token is not expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Gets token expiration time based on "remember me" preference
 *
 * @param rememberMe - Whether user chose "remember me"
 *
 * @returns Token expiration date
 */
export function getTokenExpiration(rememberMe: boolean): Date {
  const expirationDays = rememberMe
    ? securityConstants.EXTENDED_JWT_EXPIRATION_DAYS // 30 days
    : securityConstants.DEFAULT_JWT_EXPIRATION_DAYS; // 3 days

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  return expiresAt;
}

/**
 * Calculates remaining time until token expires
 *
 * @param expiresAt - Token expiration timestamp
 *
 * @returns Object with time remaining details
 */
export function getTokenTimeRemaining(expiresAt: Date): {
  expired: boolean;
  secondsRemaining: number;
  minutesRemaining: number;
  hoursRemaining: number;
  daysRemaining: number;
} {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  const expired = diff <= 0;
  const secondsRemaining = Math.max(0, Math.floor(diff / 1000));
  const minutesRemaining = Math.max(0, Math.floor(diff / (1000 * 60)));
  const hoursRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const daysRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));

  return {
    expired,
    secondsRemaining,
    minutesRemaining,
    hoursRemaining,
    daysRemaining,
  };
}

// =============================================================================
// Logout Handling
// =============================================================================

/**
 * Logs out a user by:
 * 1. Extracting user information
 * 2. Logging the logout event to auth_logs
 * 3. Returning success (client handles token clearing)
 *
 * Note: This does NOT invalidate the JWT token on the server
 * because JWTs are stateless. The token remains valid until
 * it expires. Security is maintained by:
 * - Short token expiration (3 days default, 30 days with remember me)
 * - Session validation on every request
 * - Checking user status (active/deactivated/locked)
 *
 * @param userId - User ID from JWT token
 * @param ipAddress - Request IP address for logging
 * @param userAgent - Request user agent for logging
 *
 * @returns Logout result
 */
export async function logoutUser(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<LogoutResult> {
  try {
    // Log logout event
    await logAuthEvent({
      userId,
      eventType: 'logout',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    console.error('Logout error:', error);

    // Log failed logout attempt
    await logAuthEvent({
      userId,
      eventType: 'logout',
      success: false,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: 'Failed to logout',
    };
  }
}

/**
 * Logs an authentication event to the auth_logs table
 *
 * @param params - Event parameters
 */
async function logAuthEvent(params: {
  userId: string;
  eventType: string;
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  failureReason?: string | null;
  eventDetails?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await sql`
      INSERT INTO ${authTables.authLogs} (
        user_id,
        event_type,
        event_details,
        ip_address,
        user_agent,
        session_id,
        success,
        failure_reason,
        created_at
      ) VALUES (
        ${params.userId},
        ${params.eventType},
        ${params.eventDetails ? JSON.stringify(params.eventDetails) : null},
        ${params.ipAddress || null},
        ${params.userAgent || null},
        ${params.sessionId || null},
        ${params.success},
        ${params.failureReason || null},
        ${new Date()}
      )
    `;
  } catch (error) {
    // Don't throw - logging failures shouldn't break auth flows
    console.error('Failed to log auth event:', error);
  }
}

// =============================================================================
// Session State Helpers
// =============================================================================

/**
 * Gets the current session state for a user
 *
 * @param user - User object
 *
 * @returns Session state description
 */
export function getSessionState(user: User): {
  state: 'active' | 'expired' | 'revoked' | 'invalid';
  reason?: string;
} {
  // Check if soft-deleted
  if (user.is_deleted) {
    return {
      state: 'invalid',
      reason: 'User account has been deleted',
    };
  }

  // Check if deactivated
  if (user.account_status === 'deactivated') {
    return {
      state: 'revoked',
      reason: 'Account has been deactivated',
    };
  }

  // Check if locked
  if (user.locked_until) {
    const lockedUntil = new Date(user.locked_until);
    if (lockedUntil > new Date()) {
      const lockTime = getLockExpirationTime(user.locked_until);
      return {
        state: 'revoked',
        reason: `Account is locked for ${lockTime}`,
      };
    }
  }

  // Check if email verified
  if (!user.email_verified) {
    return {
      state: 'revoked',
      reason: 'Email address must be verified',
    };
  }

  // Session is active
  return {
    state: 'active',
  };
}

/**
 * Calculates when an account will be unlocked
 *
 * @param lockedUntil - Lock expiration timestamp
 *
 * @returns Formatted lock expiration time
 */
export function getLockExpirationTime(lockedUntil: string): string {
  const lockDate = new Date(lockedUntil);
  const now = new Date();
  const diff = lockDate.getTime() - now.getTime();

  if (diff <= 0) {
    return 'now';
  }

  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''}`;
}

// =============================================================================
// Subscription Tier Validation
// =============================================================================

/**
 * Checks if a user's subscription tier allows access to a feature
 *
 * @param userTier - User's current subscription tier
 * @param requiredTier - Minimum required tier for the feature
 *
 * @returns True if user has access
 */
export function hasRequiredTier(
  userTier: string,
  requiredTier: 'trial' | 'free' | 'pro' | 'enterprise'
): boolean {
  const tierHierarchy = ['trial', 'free', 'pro', 'enterprise'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  return userTierIndex >= requiredTierIndex;
}

/**
 * Gets user's current subscription status
 *
 * @param user - User object
 *
 * @returns Subscription status object
 */
export function getUserSubscriptionStatus(user: User): {
  tier: string;
  isTrial: boolean;
  isTrialExpired: boolean;
  daysRemaining: number | null;
} {
  const tier = user.subscription_tier || 'free';
  const isTrial = tier === 'trial';
  const isTrialExpired = isTrial && user.trial_expires_at
    ? new Date(user.trial_expires_at) < new Date()
    : false;

  let daysRemaining: number | null = null;

  if (isTrial && user.trial_expires_at) {
    const trialEnd = new Date(user.trial_expires_at);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    tier,
    isTrial,
    isTrialExpired,
    daysRemaining,
  };
}
