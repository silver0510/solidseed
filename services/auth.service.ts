/**
 * Authentication Service Layer
 *
 * This module provides the business logic for authentication operations.
 * It handles user registration, login, email verification, and OAuth flows.
 *
 * The service layer sits between the API routes and the Better Auth library,
 * providing custom logic and database operations specific to Korella CRM.
 */

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { auth } from '../lib/auth';
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  createVerificationLink,
  createPasswordResetLink,
} from './email.service';
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
import { checkTrialExpiration } from './subscription.service';

// =============================================================================
// Database Connection
// =============================================================================

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required');
}

// Initialize Prisma Client with PostgreSQL adapter for Prisma 7
// Supabase requires SSL connections
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
    const existingUser = await prisma.users.findFirst({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, account_status: true, is_deleted: true }
    });

    if (existingUser) {
      const user = existingUser;

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

    // Hash the password using bcrypt (cost factor from security constants)
    const passwordHash = await bcrypt.hash(password, securityConstants.BCRYPT_COST_FACTOR);

    // Create the user in the database
    const newUser = await prisma.users.create({
      data: {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        email_verified: false,
        account_status: 'pending',
        subscription_tier: 'trial',
        failed_login_count: 0,
        is_deleted: false,
      },
    });

    // Generate email verification token (secure random 32 bytes = 64 hex chars)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Calculate token expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + securityConstants.EMAIL_VERIFICATION_EXPIRATION_HOURS);

    // Create email verification record
    await prisma.email_verifications.create({
      data: {
        user_id: newUser.id,
        token: verificationToken,
        email: newUser.email,
        expires_at: expiresAt,
        verified: false,
        request_ip: ipAddress,
        request_user_agent: userAgent,
      },
    });

    // Send verification email
    const verificationLink = createVerificationLink(verificationToken);
    await sendEmailVerificationEmail({
      to: newUser.email,
      userName: newUser.full_name,
      verificationLink,
    });

    // Log registration event
    await logAuthEvent({
      userId: newUser.id,
      eventType: 'registration',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Check your email to verify your account',
      userId: newUser.id,
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
    const verificationRecord = await prisma.email_verifications.findFirst({
      where: { token },
      include: {
        users: {
          select: { email_verified: true, account_status: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    if (!verificationRecord) {
      return {
        success: false,
        message: 'Invalid verification token',
      };
    }

    const verification = verificationRecord;

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

    await prisma.users.update({
      where: { id: verification.user_id },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
        account_status: 'active',
        subscription_tier: 'trial',
        trial_expires_at: trialExpiresAt,
        updated_at: new Date()
      }
    });

    // Mark token as verified
    await prisma.email_verifications.update({
      where: { id: verification.id },
      data: {
        verified: true,
        verified_at: new Date()
      }
    });

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
    const user = await prisma.users.findFirst({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, full_name: true, email_verified: true, account_status: true, is_deleted: true }
    });

    if (!user) {
      // Don't reveal whether email exists
      return {
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      };
    }

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
    // Find user by email
    const user = await prisma.users.findFirst({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password_hash: true,
        full_name: true,
        email_verified: true,
        account_status: true,
        subscription_tier: true,
        trial_expires_at: true,
        failed_login_count: true,
        locked_until: true,
        is_deleted: true,
      }
    });

    if (!user || !user.password_hash) {
      // Log failed login attempt
      await logAuthEvent({
        userId: null,
        eventType: 'login_fail',
        success: false,
        failureReason: 'Invalid credentials',
        targetEmail: email,
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return {
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts',
      };
    }

    // Check if account is deactivated or deleted
    if (user.account_status === 'deactivated' || user.is_deleted) {
      return {
        success: false,
        message: 'Account has been deactivated',
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed login count
      const newFailedCount = user.failed_login_count + 1;
      const updateData: any = {
        failed_login_count: newFailedCount,
        updated_at: new Date(),
      };

      // Lock account if too many failed attempts
      if (newFailedCount >= securityConstants.MAX_FAILED_LOGIN_ATTEMPTS) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + securityConstants.LOCKOUT_DURATION_MINUTES);
        updateData.locked_until = lockUntil;
      }

      await prisma.users.update({
        where: { id: user.id },
        data: updateData
      });

      // Log failed login attempt
      await logAuthEvent({
        userId: user.id,
        eventType: 'login_fail',
        success: false,
        failureReason: 'Invalid password',
        targetEmail: email,
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    // Check if email is verified
    if (!user.email_verified) {
      return {
        success: false,
        message: 'Please verify your email before logging in',
      };
    }

    // Check trial expiration and downgrade if needed
    const currentTier = user.subscription_tier as SubscriptionTier;
    const trialExpiresAt = user.trial_expires_at;
    const updatedTier = await checkTrialExpiration(
      user.id,
      currentTier,
      trialExpiresAt ? trialExpiresAt.toISOString() : null
    );

    // Update last login and reset failed login count
    await prisma.users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        last_login_ip: ipAddress,
        failed_login_count: 0,
        updated_at: new Date(),
      }
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = rememberMe ? '30d' : '3d';

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        subscriptionTier: updatedTier,
      },
      jwtSecret,
      { expiresIn }
    );

    // Log successful login
    await logAuthEvent({
      userId: user.id,
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
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        subscriptionTier: updatedTier,
        trialExpiresAt: updatedTier === 'free' ? null : (trialExpiresAt ? trialExpiresAt.toISOString() : null),
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
 * Handles OAuth callback from Google
 *
 * @param provider - OAuth provider ('google')
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
 * @param provider - OAuth provider ('google')
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
    await prisma.auth_logs.create({
      data: {
        user_id: params.userId || null,
        event_type: params.eventType,
        event_details: params.eventDetails || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        session_id: params.sessionId || null,
        target_email: params.targetEmail || null,
        success: params.success,
        failure_reason: params.failureReason || null,
        created_at: new Date()
      }
    });
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
    const logs = await prisma.auth_logs.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit
    });

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

// =============================================================================
// Password Reset Management
// =============================================================================

/**
 * Requests a password reset by creating a reset token and sending email
 *
 * @param email - User's email address
 * @param ipAddress - Request IP address for logging
 * @param userAgent - Request user agent for logging
 *
 * @returns Success status and message
 */
export async function requestPasswordReset(
  email: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    // Find user by email
    const user = await prisma.users.findFirst({
      where: {
        email: email.toLowerCase(),
        is_deleted: false
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        account_status: true,
      }
    });

    // Don't reveal if user exists for security
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }

    // Check if account is deactivated
    if (user.account_status === 'deactivated') {
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + securityConstants.PASSWORD_RESET_EXPIRATION_HOURS);

    // Create password reset record
    await prisma.password_resets.create({
      data: {
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
        used: false,
        request_ip: ipAddress,
        request_user_agent: userAgent,
      }
    });

    // Send password reset email
    const resetLink = createPasswordResetLink(resetToken);
    await sendPasswordResetEmail({
      to: user.email,
      userName: user.full_name,
      resetLink,
    });

    // Log password reset request
    await logAuthEvent({
      userId: user.id,
      eventType: 'password_reset_request',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: 'Failed to process password reset request. Please try again.',
    };
  }
}

/**
 * Resets a user's password using a valid reset token
 *
 * @param token - Password reset token
 * @param newPassword - New password
 * @param ipAddress - Request IP address for logging
 * @param userAgent - Request user agent for logging
 *
 * @returns Success status and message
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    // Find valid reset token
    const resetRecord = await prisma.password_resets.findFirst({
      where: {
        token,
        used: false,
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            full_name: true,
            is_deleted: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!resetRecord || resetRecord.users.is_deleted) {
      return {
        success: false,
        message: 'Invalid or expired password reset token.',
      };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, securityConstants.BCRYPT_COST_FACTOR);

    // Update user password and reset failed login count
    await prisma.users.update({
      where: { id: resetRecord.user_id },
      data: {
        password_hash: passwordHash,
        failed_login_count: 0,
        locked_until: null,
        updated_at: new Date(),
      }
    });

    // Mark token as used
    await prisma.password_resets.update({
      where: { id: resetRecord.id },
      data: {
        used: true,
        used_at: new Date(),
      }
    });

    // Send confirmation email
    await sendPasswordChangedEmail({
      to: resetRecord.users.email,
      userName: resetRecord.users.full_name,
      changedAt: new Date(),
    });

    // Log password reset completion
    await logAuthEvent({
      userId: resetRecord.user_id,
      eventType: 'password_reset_complete',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'Failed to reset password. Please try again.',
    };
  }
}

/**
 * Changes password for an authenticated user
 *
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @param ipAddress - Request IP address for logging
 * @param userAgent - Request user agent for logging
 *
 * @returns Success status and message
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    // Get user with password hash
    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        is_deleted: false
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        password_hash: true,
      }
    });

    if (!user || !user.password_hash) {
      return {
        success: false,
        message: 'User not found.',
      };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Current password is incorrect.',
      };
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      return {
        success: false,
        message: 'New password must be different from current password.',
      };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, securityConstants.BCRYPT_COST_FACTOR);

    // Update password
    await prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
        updated_at: new Date(),
      }
    });

    // Send confirmation email
    await sendPasswordChangedEmail({
      to: user.email,
      userName: user.full_name,
      changedAt: new Date(),
    });

    // Log password change
    await logAuthEvent({
      userId,
      eventType: 'password_change',
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Password has been changed successfully.',
    };
  } catch (error) {
    console.error('Password change error:', error);
    return {
      success: false,
      message: 'Failed to change password. Please try again.',
    };
  }
}
