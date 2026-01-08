/**
 * Authentication Service Layer
 *
 * This module provides the business logic for authentication operations.
 * It handles user registration, login, email verification, and OAuth flows.
 *
 * The service layer sits between the API routes and the Better Auth library,
 * providing custom logic and database operations specific to Korella CRM.
 */

import { neon } from '@neondatabase/serverless';
import { auth } from '../lib/auth';
import {
  securityConstants,
  authTables,
  type User,
  type EmailVerification,
  type AuthLog,
  type OAuthProvider as OAuthProviderType,
  type AccountStatus,
  type SubscriptionTier,
} from '../config/database';
import { resendVerificationEmail } from './email.service';
import { checkTrialExpiration } from './subscription.service';

// =============================================================================
// Database Connection
// =============================================================================

const databaseUrl = process.env.SUPABASE_DATABASE_URL || '';
if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL environment variable is required');
}

const sql = neon(databaseUrl);

// =============================================================================
// Authentication Service Functions
// =============================================================================

/**
 * Registers a new user with email and password
 *
 * @param email - User's email address
 * @param password - User's password (will be hashed)
 * @param fullName - User's full name
 * @param ipAddress - Request IP address for logging
 * @param userAgent - Request user agent for logging
 *
 * @returns Success status and message
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id, email, account_status, is_deleted
      FROM ${authTables.users}
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    if (existingUser.length > 0) {
      const user = existingUser[0] as any;

      // Check if user was soft-deleted
      if (user.is_deleted) {
        return {
          success: false,
          message: 'This email address was previously deleted. Please contact support.',
        };
      }

      // Check if user is pending verification
      if (user.account_status === 'pending') {
        return {
          success: false,
          message: 'An account with this email already exists and is pending verification. Please check your email.',
        };
      }

      // User already exists and is active
      return {
        success: false,
        message: 'An account with this email already exists.',
      };
    }

    // Use Better Auth to sign up the user
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
      },
    });

    if (result.error) {
      return {
        success: false,
        message: result.error.message || 'Failed to create account',
      };
    }

    // Log registration event
    await logAuthEvent({
      userId: result.user?.id,
      eventType: 'registration',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Check your email to verify your account',
      userId: result.user?.id,
    };
  } catch (error) {
    console.error('Registration error:', error);

    // Log failed registration attempt
    await logAuthEvent({
      userId: null,
      eventType: 'registration',
      success: false,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      targetEmail: email,
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: 'Failed to create account. Please try again.',
    };
  }
}

/**
 * Verifies a user's email address using a verification token
 *
 * @param token - Email verification token
 *
 * @returns Success status and redirect URL
 */
export async function verifyEmail(
  token: string
): Promise<{ success: boolean; message: string; redirect?: string }> {
  try {
    // Find the verification token
    const verificationRecords = await sql`
      SELECT ev.id, ev.user_id, ev.email, ev.expires_at, ev.verified, u.email_verified, u.account_status
      FROM ${authTables.emailVerifications} ev
      JOIN ${authTables.users} u ON ev.user_id = u.id
      WHERE ev.token = ${token}
      ORDER BY ev.created_at DESC
      LIMIT 1
    `;

    if (verificationRecords.length === 0) {
      return {
        success: false,
        message: 'Invalid verification token',
      };
    }

    const verification = verificationRecords[0] as any;

    // Check if already verified
    if (verification.verified) {
      return {
        success: true,
        message: 'Email already verified',
        redirect: '/login',
      };
    }

    // Check if token has expired
    if (new Date(verification.expires_at) < new Date()) {
      return {
        success: false,
        message: 'Verification token has expired. Please request a new one.',
      };
    }

    // Update user as verified and active, starting trial period
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + securityConstants.TRIAL_PERIOD_DAYS);
    trialExpiresAt.setHours(23, 59, 59, 999); // End of the day

    await sql`
      UPDATE ${authTables.users}
      SET email_verified = true,
          email_verified_at = ${new Date()},
          account_status = 'active',
          subscription_tier = 'trial',
          trial_expires_at = ${trialExpiresAt},
          updated_at = ${new Date()}
      WHERE id = ${verification.user_id}
    `;

    // Mark token as verified
    await sql`
      UPDATE ${authTables.emailVerifications}
      SET verified = true,
          verified_at = ${new Date()}
      WHERE id = ${verification.id}
    `;

    // Log verification event
    await logAuthEvent({
      userId: verification.user_id,
      eventType: 'email_verification',
      success: true,
    });

    return {
      success: true,
      message: 'Email verified successfully',
      redirect: '/login',
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      message: 'Failed to verify email. Please try again.',
    };
  }
}

/**
 * Resends a verification email to the user
 *
 * @param email - User's email address
 * @param ipAddress - Request IP address for logging
 * @param userAgent - Request user agent for logging
 *
 * @returns Success status and message
 */
export async function resendVerificationEmail(
  email: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    // Find the user
    const users = await sql`
      SELECT id, email, full_name, email_verified, account_status, is_deleted
      FROM ${authTables.users}
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    if (users.length === 0) {
      // Don't reveal whether email exists
      return {
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      };
    }

    const user = users[0] as any;

    // Check if user is deleted
    if (user.is_deleted) {
      return {
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      };
    }

    // Check if already verified
    if (user.email_verified) {
      return {
        success: false,
        message: 'Email is already verified. You can now log in.',
      };
    }

    // Check if account is not pending
    if (user.account_status !== 'pending') {
      return {
        success: false,
        message: 'Account is not in a state that requires verification.',
      };
    }

    // Use Better Auth to resend verification email
    const result = await auth.api.sendVerificationEmail({
      body: {
        email: user.email,
      },
    });

    if (result.error) {
      return {
        success: false,
        message: result.error.message || 'Failed to resend verification email',
      };
    }

    // Log resend event
    await logAuthEvent({
      userId: user.id,
      eventType: 'email_verification_resend',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  } catch (error) {
    console.error('Resend verification error:', error);

    // Log failed resend attempt
    await logAuthEvent({
      userId: null,
      eventType: 'email_verification_resend',
      success: false,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      targetEmail: email,
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: 'Failed to resend verification email. Please try again.',
    };
  }
}

/**
 * Authenticates a user with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @param rememberMe - Whether to extend session to 30 days
 * @param ipAddress - Request IP address for logging and security
 * @param userAgent - Request user agent for logging
 *
 * @returns Success status, token, and user data
 */
export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    subscriptionTier: string;
    trialExpiresAt: string | null;
  };
}> {
  try {
    // Use Better Auth to sign in
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe,
      },
    });

    if (result.error) {
      // Log failed login attempt
      await logAuthEvent({
        userId: null,
        eventType: 'login_fail',
        success: false,
        failureReason: result.error.message,
        targetEmail: email,
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        message: result.error.message || 'Invalid credentials',
      };
    }

    if (!result.user || !result.session) {
      return {
        success: false,
        message: 'Authentication failed',
      };
    }

    // Check if email is verified
    if (!result.user.emailVerified) {
      return {
        success: false,
        message: 'Please verify your email before logging in',
      };
    }

    // Check account status
    const userData = result.user as any;
    const currentTier = (userData.subscription_tier || 'trial') as SubscriptionTier;
    const trialExpiresAt = userData.trial_expires_at || null;

    // Check if account is locked
    if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
      return {
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts',
      };
    }

    // Check if account is deactivated
    if (userData.account_status === 'deactivated' || userData.is_deleted) {
      return {
        success: false,
        message: 'Account has been deactivated',
      };
    }

    // Check trial expiration and downgrade if needed
    const updatedTier = await checkTrialExpiration(
      result.user.id,
      currentTier,
      trialExpiresAt
    );

    // Log successful login
    await logAuthEvent({
      userId: result.user.id,
      eventType: 'login_success',
      success: true,
      ipAddress,
      userAgent,
      eventDetails: {
        subscription_tier: updatedTier,
        trial_expired: updatedTier !== currentTier,
      },
    });

    return {
      success: true,
      message: 'Login successful',
      token: result.session.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.name,
        subscriptionTier: updatedTier,
        trialExpiresAt: updatedTier === 'free' ? null : trialExpiresAt,
      },
    };
  } catch (error) {
    console.error('Login error:', error);

    // Log failed login attempt
    await logAuthEvent({
      userId: null,
      eventType: 'login_fail',
      success: false,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      targetEmail: email,
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: 'Login failed. Please try again.',
    };
  }
}

/**
 * Handles OAuth callback from Google or Microsoft
 *
 * @param provider - OAuth provider ('google' or 'microsoft')
 * @param code - Authorization code from OAuth provider
 * @param state - OAuth state parameter for CSRF protection
 * @param ipAddress - Request IP address for logging
 * @param userAgent - Request user agent for logging
 *
 * @returns Success status, token, user data, and redirect URL
 */
export async function handleOAuthCallback(
  provider: OAuthProviderType,
  code: string,
  state?: string | null,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    subscriptionTier: string;
  };
  redirect?: string;
}> {
  try {
    // Use Better Auth to handle OAuth callback
    const result = await auth.api.getCallbackURL(
      `/api/auth/callback/${provider}`
    );

    // Better Auth handles the OAuth flow internally
    // We need to call the social sign-in callback
    const callbackResult = await auth.api.callbackSocial({
      body: {
        code,
        state,
      },
      query: {
        provider,
      },
    });

    if (callbackResult.error) {
      // Log failed OAuth attempt
      await logAuthEvent({
        userId: null,
        eventType: 'oauth_login',
        success: false,
        failureReason: callbackResult.error.message,
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        message: callbackResult.error.message || 'OAuth authentication failed',
      };
    }

    if (!callbackResult.user || !callbackResult.session) {
      return {
        success: false,
        message: 'OAuth authentication failed',
      };
    }

    const userData = callbackResult.user as any;
    const currentTier = (userData.subscription_tier || 'trial') as SubscriptionTier;
    const trialExpiresAt = userData.trial_expires_at || null;

    // Check trial expiration and downgrade if needed
    const updatedTier = await checkTrialExpiration(
      callbackResult.user.id,
      currentTier,
      trialExpiresAt
    );

    // Log successful OAuth login
    await logAuthEvent({
      userId: callbackResult.user.id,
      eventType: 'oauth_login',
      success: true,
      eventDetails: { provider, subscription_tier: updatedTier },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'OAuth login successful',
      token: callbackResult.session.token,
      user: {
        id: callbackResult.user.id,
        email: callbackResult.user.email,
        fullName: callbackResult.user.name,
        subscriptionTier: updatedTier,
      },
      redirect: '/dashboard',
    };
  } catch (error) {
    console.error('OAuth callback error:', error);

    // Log failed OAuth attempt
    await logAuthEvent({
      userId: null,
      eventType: 'oauth_login',
      success: false,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: 'OAuth authentication failed. Please try again.',
    };
  }
}

/**
 * Generates OAuth authorization URL for redirecting user to provider
 *
 * @param provider - OAuth provider ('google' or 'microsoft')
 *
 * @returns OAuth authorization URL
 */
export function getOAuthAuthorizationURL(
  provider: OAuthProviderType
): string {
  const baseURL = process.env.BETTER_AUTH_URL || process.env.APP_URL || 'http://localhost:3000';
  return `${baseURL}/api/auth/oauth/${provider}`;
}

// =============================================================================
// Authentication Logging
// =============================================================================

/**
 * Logs an authentication event to the auth_logs table
 *
 * @param params - Event parameters
 */
async function logAuthEvent(params: {
  userId: string | null;
  eventType: string;
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  targetEmail?: string | null;
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
        target_email,
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
        ${params.targetEmail || null},
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

/**
 * Retrieves authentication logs for a user
 *
 * @param userId - User ID
 * @param limit - Maximum number of logs to retrieve
 *
 * @returns Array of auth log entries
 */
export async function getUserAuthLogs(
  userId: string,
  limit: number = 50
): Promise<AuthLog[]> {
  try {
    const logs = await sql`
      SELECT *
      FROM ${authTables.authLogs}
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return logs as AuthLog[];
  } catch (error) {
    console.error('Failed to retrieve auth logs:', error);
    return [];
  }
}

// =============================================================================
// Account Lockout Management
// =============================================================================

/**
 * Checks if a user's account is currently locked
 *
 * @param user - User object
 *
 * @returns True if account is locked
 */
export function isAccountLocked(user: Pick<User, 'locked_until'>): boolean {
  if (!user.locked_until) {
    return false;
  }

  const lockUntil = new Date(user.locked_until);
  return lockUntil > new Date();
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
// User Status Helpers
// =============================================================================

/**
 * Checks if a user can authenticate
 *
 * @param user - User object
 *
 * @returns Object with canAuthenticate flag and reason
 */
export function canUserAuthenticate(
  user: User
): { canAuthenticate: boolean; reason?: string } {
  // Check if soft-deleted
  if (user.is_deleted) {
    return {
      canAuthenticate: false,
      reason: 'Account has been deleted',
    };
  }

  // Check if deactivated
  if (user.account_status === 'deactivated') {
    return {
      canAuthenticate: false,
      reason: 'Account has been deactivated',
    };
  }

  // Check if locked
  if (isAccountLocked(user)) {
    const lockTime = getLockExpirationTime(user.locked_until!);
    return {
      canAuthenticate: false,
      reason: `Account is locked for ${lockTime}`,
    };
  }

  // Check if email verified (for email/password login)
  if (!user.email_verified) {
    return {
      canAuthenticate: false,
      reason: 'Email address must be verified',
    };
  }

  return {
    canAuthenticate: true,
  };
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
