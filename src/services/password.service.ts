/**
 * Password Management Service for Korella CRM
 *
 * This module handles password-related operations including:
 * - Password reset token generation and validation
 * - Password reset request and completion
 * - Password change for authenticated users
 * - Password hashing and verification
 *
 * Environment Variables Required:
 * - SUPABASE_DATABASE_URL: PostgreSQL connection string
 */

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import {
  authTables,
  securityConstants,
  type User,
  type PasswordReset,
} from '../config/database';
import { validatePassword } from '../lib/password-validation';
import {
  logPasswordReset,
  logPasswordChange,
  logAuthEvent,
} from './security.service';
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from './email.service';

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
// Password Hashing
// =============================================================================

/**
 * Hashes a password using bcrypt
 *
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = securityConstants.BCRYPT_COST_FACTOR;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verifies a password against a hash
 *
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// =============================================================================
// Password Reset Token Management
// =============================================================================

/**
 * Generates a cryptographically random password reset token
 *
 * @returns Random token
 */
export function generatePasswordResetToken(): string {
  return nanoid(64); // 64-character cryptographically random string
}

/**
 * Creates a password reset token for a user
 *
 * @param email - User email address
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent string
 * @returns Created password reset record or null if user not found
 */
export async function createPasswordResetToken(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<PasswordReset | null> {
  const id = nanoid();
  const token = generatePasswordResetToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + securityConstants.PASSWORD_RESET_EXPIRATION_HOURS);

  try {
    // Find user by email
    const userResult = await sql`
      SELECT id, email, full_name
      FROM ${sql(authTables.users)}
      WHERE email = ${email}
        AND is_deleted = false
    `;

    if (!userResult || userResult.length === 0) {
      // User not found - return null but don't throw for security
      // (we don't want to reveal which emails exist in the system)
      return null;
    }

    const user = userResult[0] as { id: string; email: string; full_name: string };

    // Create password reset record
    const result = await sql`
      INSERT INTO ${sql(authTables.passwordResets)} (
        id,
        user_id,
        token,
        expires_at,
        used,
        request_ip,
        request_user_agent,
        created_at
      ) VALUES (
        ${id},
        ${user.id},
        ${token},
        ${expiresAt.toISOString()},
        false,
        ${ipAddress || null},
        ${userAgent || null},
        ${new Date().toISOString()}
      )
      RETURNING *
    `;

    const passwordReset = result[0] as PasswordReset;

    // Send password reset email
    await sendPasswordResetEmail({
      to: user.email,
      userName: user.full_name,
      resetLink: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`,
    });

    // Log the password reset request
    await logAuthEvent({
      userId: user.id,
      eventType: 'password_reset_request',
      ipAddress,
      userAgent,
      success: true,
    });

    return passwordReset;
  } catch (error) {
    console.error('Error creating password reset token:', error);
    throw error;
  }
}

/**
 * Validates a password reset token
 *
 * @param token - Password reset token
 * @returns Password reset record or null if invalid
 */
export async function validatePasswordResetToken(
  token: string
): Promise<PasswordReset & { user: User } | null> {
  try {
    const result = await sql`
      SELECT pr.*, u.id as user_id, u.email, u.full_name, u.password_hash,
             u.email_verified, u.account_status, u.subscription_tier,
             u.failed_login_count, u.locked_until
      FROM ${sql(authTables.passwordResets)} pr
      INNER JOIN ${sql(authTables.users)} u ON pr.user_id = u.id
      WHERE pr.token = ${token}
        AND pr.used = false
        AND pr.expires_at > ${new Date().toISOString()}
        AND u.is_deleted = false
      ORDER BY pr.created_at DESC
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return null;
    }

    return result[0] as PasswordReset & { user: User };
  } catch (error) {
    console.error('Error validating password reset token:', error);
    return null;
  }
}

/**
 * Completes a password reset using a valid token
 *
 * @param token - Password reset token
 * @param newPassword - New password
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent string
 * @returns Success status and error message if failed
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate token
    const resetRecord = await validatePasswordResetToken(token);

    if (!resetRecord) {
      return {
        success: false,
        error: 'Invalid or expired password reset token',
      };
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      };
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await sql`
      UPDATE ${sql(authTables.users)}
      SET password_hash = ${passwordHash},
          updated_at = ${new Date().toISOString()},
          failed_login_count = 0,
          locked_until = NULL
      WHERE id = ${resetRecord.user_id}
    `;

    // Mark token as used
    await sql`
      UPDATE ${sql(authTables.passwordResets)}
      SET used = true,
          used_at = ${new Date().toISOString()}
      WHERE id = ${resetRecord.id}
    `;

    // Invalidate all existing sessions for this user
    await sql`
      DELETE FROM sessions
      WHERE user_id = ${resetRecord.user_id}
    `;

    // Send password change confirmation email
    await sendPasswordChangedEmail({
      to: resetRecord.user.email,
      userName: resetRecord.user.full_name,
      changedAt: new Date(),
    });

    // Log the password reset
    await logPasswordReset(resetRecord.user_id, ipAddress, userAgent);

    return { success: true };
  } catch (error) {
    console.error('Error completing password reset:', error);
    return {
      success: false,
      error: 'Failed to complete password reset',
    };
  }
}

// =============================================================================
// Password Change for Authenticated Users
// =============================================================================

/**
 * Changes password for an authenticated user
 *
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent string
 * @returns Success status and error message if failed
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user with current password hash
    const userResult = await sql`
      SELECT id, email, full_name, password_hash
      FROM ${sql(authTables.users)}
      WHERE id = ${userId}
        AND is_deleted = false
    `;

    if (!userResult || userResult.length === 0) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const user = userResult[0] as { id: string; email: string; full_name: string; password_hash: string };

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Check if new password is same as current
    const isSamePassword = await verifyPassword(newPassword, user.password_hash);
    if (isSamePassword) {
      return {
        success: false,
        error: 'New password must be different from current password',
      };
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password
    await sql`
      UPDATE ${sql(authTables.users)}
      SET password_hash = ${newPasswordHash},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${userId}
    `;

    // Send password change confirmation email
    await sendPasswordChangedEmail({
      to: user.email,
      userName: user.full_name,
      changedAt: new Date(),
    });

    // Log the password change
    await logPasswordChange(userId, ipAddress, userAgent);

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      success: false,
      error: 'Failed to change password',
    };
  }
}

// =============================================================================
// Password Reset Cleanup
// =============================================================================

/**
 * Deletes expired password reset tokens
 * (Should be run periodically as a background job)
 *
 * @returns Number of tokens deleted
 */
export async function purgeExpiredPasswordResetTokens(): Promise<number> {
  try {
    const result = await sql`
      DELETE FROM ${sql(authTables.passwordResets)}
      WHERE expires_at < ${new Date().toISOString()}
         OR (used = true AND used_at < ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()})
      RETURNING id
    `;

    const deletedCount = result.length;

    if (deletedCount > 0) {
      console.log(`Purged ${deletedCount} expired password reset tokens`);
    }

    return deletedCount;
  } catch (error) {
    console.error('Error purging expired password reset tokens:', error);
    return 0;
  }
}

// =============================================================================
// Password Policy Enforcement
// =============================================================================

/**
 * Checks if a password meets the complexity requirements
 *
 * @param password - Password to check
 * @returns Validation result
 */
export function checkPasswordRequirements(password: string): {
  meetsRequirements: boolean;
  errors: string[];
} {
  const validation = validatePassword(password);

  return {
    meetsRequirements: validation.valid,
    errors: validation.errors,
  };
}

/**
 * Checks if a user needs to reset their password
 * (e.g., for expired passwords or forced resets)
 *
 * @param userId - User ID
 * @returns True if password reset is required
 */
export async function isPasswordResetRequired(userId: string): Promise<boolean> {
  // This can be extended to implement password expiration policies
  // For now, it returns false (no forced resets)
  return false;
}
