/**
 * Subscription Service Layer
 *
 * This module provides business logic for subscription and trial period management.
 * It handles:
 * - Trial period tracking (14 days from email verification)
 * - Subscription tier management
 * - Trial expiration checking and automatic downgrade
 * - Account activation/deactivation
 * - Subscription status queries
 *
 * Subscription Tiers:
 * - trial: Full access for 14 days from email verification
 * - free: Limited features (baseline)
 * - pro: Full features (paid subscription)
 * - enterprise: Advanced features (paid subscription)
 */

import { neon } from '@neondatabase/serverless';
import {
  authTables,
  securityConstants,
  type User,
  type SubscriptionTier,
  type AccountStatus,
} from '../config/database';

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
 * Subscription status information
 */
export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isTrial: boolean;
  isTrialExpired: boolean;
  daysRemaining: number | null;
  trialExpiresAt: string | null;
  canAccessFeature: (requiredTier: SubscriptionTier) => boolean;
}

/**
 * User subscription information with calculated fields
 */
export interface UserSubscriptionInfo {
  userId: string;
  email: string;
  fullName: string;
  subscriptionTier: SubscriptionTier;
  accountStatus: AccountStatus;
  trialExpiresAt: string | null;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
}

// =============================================================================
// Trial Period Management
// =============================================================================

/**
 * Calculates trial expiration date (14 days from now)
 *
 * @returns Date object set to 14 days from now
 */
export function calculateTrialExpiration(): Date {
  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() + securityConstants.TRIAL_PERIOD_DAYS);
  trialExpiresAt.setHours(23, 59, 59, 999); // End of the day
  return trialExpiresAt;
}

/**
 * Calculates remaining days in trial period
 *
 * @param trialExpiresAt - Trial expiration date
 *
 * @returns Number of days remaining (0 if expired), or null if not on trial
 */
export function calculateTrialDaysRemaining(trialExpiresAt: string | null): number | null {
  if (!trialExpiresAt) {
    return null;
  }

  const trialEnd = new Date(trialExpiresAt);
  const now = new Date();
  const diff = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.floor(diff / (1000 * 60 * 60 * 24));

  return Math.max(0, daysRemaining);
}

/**
 * Checks if trial period has expired
 *
 * @param trialExpiresAt - Trial expiration date
 *
 * @returns True if trial has expired
 */
export function isTrialExpired(trialExpiresAt: string | null): boolean {
  if (!trialExpiresAt) {
    return false;
  }

  return new Date(trialExpiresAt) < new Date();
}

// =============================================================================
// Subscription Tier Management
// =============================================================================

/**
 * Checks if a user's subscription tier grants access to a feature
 *
 * @param userTier - User's current subscription tier
 * @param requiredTier - Minimum tier required for the feature
 *
 * @returns True if user has access
 */
export function hasRequiredTier(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    trial: 0,
    free: 1,
    pro: 2,
    enterprise: 3,
  };

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

/**
 * Gets the subscription tier hierarchy level
 *
 * @param tier - Subscription tier
 *
 * @returns Numeric hierarchy level (0-3)
 */
export function getTierLevel(tier: SubscriptionTier): number {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    trial: 0,
    free: 1,
    pro: 2,
    enterprise: 3,
  };

  return tierHierarchy[tier];
}

// =============================================================================
// User Subscription Operations
// =============================================================================

/**
 * Starts trial period for a user (called during email verification)
 *
 * @param userId - User ID
 *
 * @returns Success status and trial expiration date
 */
export async function startTrialPeriod(
  userId: string
): Promise<{ success: boolean; trialExpiresAt: Date | null; error?: string }> {
  try {
    const trialExpiresAt = calculateTrialExpiration();

    await sql`
      UPDATE ${authTables.users}
      SET trial_expires_at = ${trialExpiresAt},
          subscription_tier = 'trial',
          account_status = 'active',
          updated_at = ${new Date()}
      WHERE id = ${userId}
    `;

    return {
      success: true,
      trialExpiresAt,
    };
  } catch (error) {
    console.error('Failed to start trial period:', error);
    return {
      success: false,
      trialExpiresAt: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Checks and handles trial expiration on login
 * Automatically downgrades expired trials to free tier
 *
 * @param userId - User ID
 * @param currentTier - Current subscription tier
 * @param trialExpiresAt - Trial expiration date
 *
 * @returns Updated subscription tier (may be downgraded)
 */
export async function checkTrialExpiration(
  userId: string,
  currentTier: SubscriptionTier,
  trialExpiresAt: string | null
): Promise<SubscriptionTier> {
  // Only check if user is on trial
  if (currentTier !== 'trial' || !trialExpiresAt) {
    return currentTier;
  }

  // Check if trial has expired
  if (isTrialExpired(trialExpiresAt)) {
    try {
      // Downgrade to free tier
      await sql`
        UPDATE ${authTables.users}
        SET subscription_tier = 'free',
            updated_at = ${new Date()}
        WHERE id = ${userId}
      `;

      return 'free';
    } catch (error) {
      console.error('Failed to downgrade expired trial:', error);
      // Return current tier on error
      return currentTier;
    }
  }

  return currentTier;
}

/**
 * Changes a user's subscription tier
 *
 * @param userId - User ID
 * @param newTier - New subscription tier
 *
 * @returns Success status
 */
export async function changeSubscriptionTier(
  userId: string,
  newTier: SubscriptionTier
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE ${authTables.users}
      SET subscription_tier = ${newTier},
          updated_at = ${new Date()}
      WHERE id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Failed to change subscription tier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Account Status Management
// =============================================================================

/**
 * Deactivates a user account
 *
 * @param userId - User ID
 *
 * @returns Success status
 */
export async function deactivateAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE ${authTables.users}
      SET account_status = 'deactivated',
          updated_at = ${new Date()}
      WHERE id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Failed to deactivate account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Activates a user account
 *
 * @param userId - User ID
 *
 * @returns Success status
 */
export async function activateAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE ${authTables.users}
      SET account_status = 'active',
          updated_at = ${new Date()}
      WHERE id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Failed to activate account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Subscription Status Queries
// =============================================================================

/**
 * Gets comprehensive subscription status for a user
 *
 * @param user - User object
 *
 * @returns Subscription status with helper methods
 */
export function getSubscriptionStatus(user: Pick<User, 'subscription_tier' | 'trial_expires_at'>): SubscriptionStatus {
  const tier = user.subscription_tier || 'free';
  const isTrial = tier === 'trial';
  const trialExpiresAt = user.trial_expires_at;
  const isTrialExpired = isTrial && trialExpiresAt ? isTrialExpired(trialExpiresAt) : false;
  const daysRemaining = isTrial && trialExpiresAt ? calculateTrialDaysRemaining(trialExpiresAt) : null;

  return {
    tier,
    isTrial,
    isTrialExpired,
    daysRemaining,
    trialExpiresAt,
    canAccessFeature: (requiredTier: SubscriptionTier) => hasRequiredTier(tier, requiredTier),
  };
}

/**
 * Gets user subscription information from database
 *
 * @param userId - User ID
 *
 * @returns User subscription information or null
 */
export async function getUserSubscriptionInfo(
  userId: string
): Promise<UserSubscriptionInfo | null> {
  try {
    const users = await sql`
      SELECT
        id,
        email,
        full_name,
        subscription_tier,
        account_status,
        trial_expires_at
      FROM ${authTables.users}
      WHERE id = ${userId} AND is_deleted = false
      LIMIT 1
    `;

    if (users.length === 0) {
      return null;
    }

    const user = users[0] as any;
    const trialExpiresAt = user.trial_expires_at;
    const trialDaysRemaining = calculateTrialDaysRemaining(trialExpiresAt);
    const isTrialExpired = user.subscription_tier === 'trial' && trialExpiresAt
      ? isTrialExpired(trialExpiresAt)
      : false;

    return {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      subscriptionTier: user.subscription_tier,
      accountStatus: user.account_status,
      trialExpiresAt,
      trialDaysRemaining,
      isTrialExpired,
    };
  } catch (error) {
    console.error('Failed to get user subscription info:', error);
    return null;
  }
}

/**
 * Gets all users with their subscription information (for admin)
 *
 * @param limit - Maximum number of users to return
 * @param offset - Number of users to skip
 *
 * @returns Array of user subscription information
 */
export async function getAllUsersSubscriptionInfo(
  limit: number = 50,
  offset: number = 0
): Promise<UserSubscriptionInfo[]> {
  try {
    const users = await sql`
      SELECT
        id,
        email,
        full_name,
        subscription_tier,
        account_status,
        trial_expires_at
      FROM ${authTables.users}
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return users.map((user: any) => {
      const trialExpiresAt = user.trial_expires_at;
      const trialDaysRemaining = calculateTrialDaysRemaining(trialExpiresAt);
      const isTrialExpired = user.subscription_tier === 'trial' && trialExpiresAt
        ? isTrialExpired(trialExpiresAt)
        : false;

      return {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        subscriptionTier: user.subscription_tier,
        accountStatus: user.account_status,
        trialExpiresAt,
        trialDaysRemaining,
        isTrialExpired,
      };
    });
  } catch (error) {
    console.error('Failed to get all users subscription info:', error);
    return [];
  }
}

// =============================================================================
// Analytics and Reporting
// =============================================================================

/**
 * Gets subscription statistics
 *
 * @returns Object with counts by tier and status
 */
export async function getSubscriptionStats(): Promise<{
  totalUsers: number;
  byTier: Record<SubscriptionTier, number>;
  byStatus: Record<AccountStatus, number>;
  activeTrialUsers: number;
  expiredTrialUsers: number;
}> {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE subscription_tier = 'trial') as trial_users,
        COUNT(*) FILTER (WHERE subscription_tier = 'free') as free_users,
        COUNT(*) FILTER (WHERE subscription_tier = 'pro') as pro_users,
        COUNT(*) FILTER (WHERE subscription_tier = 'enterprise') as enterprise_users,
        COUNT(*) FILTER (WHERE account_status = 'active') as active_users,
        COUNT(*) FILTER (WHERE account_status = 'pending') as pending_users,
        COUNT(*) FILTER (WHERE account_status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE account_status = 'deactivated') as deactivated_users,
        COUNT(*) FILTER (WHERE subscription_tier = 'trial' AND trial_expires_at > NOW()) as active_trial_users,
        COUNT(*) FILTER (WHERE subscription_tier = 'trial' AND trial_expires_at < NOW()) as expired_trial_users
      FROM ${authTables.users}
      WHERE is_deleted = false
    `;

    const row = result[0] as any;

    return {
      totalUsers: parseInt(row.total_users) || 0,
      byTier: {
        trial: parseInt(row.trial_users) || 0,
        free: parseInt(row.free_users) || 0,
        pro: parseInt(row.pro_users) || 0,
        enterprise: parseInt(row.enterprise_users) || 0,
      },
      byStatus: {
        active: parseInt(row.active_users) || 0,
        pending: parseInt(row.pending_users) || 0,
        suspended: parseInt(row.suspended_users) || 0,
        deactivated: parseInt(row.deactivated_users) || 0,
      },
      activeTrialUsers: parseInt(row.active_trial_users) || 0,
      expiredTrialUsers: parseInt(row.expired_trial_users) || 0,
    };
  } catch (error) {
    console.error('Failed to get subscription stats:', error);
    return {
      totalUsers: 0,
      byTier: { trial: 0, free: 0, pro: 0, enterprise: 0 },
      byStatus: { active: 0, pending: 0, suspended: 0, deactivated: 0 },
      activeTrialUsers: 0,
      expiredTrialUsers: 0,
    };
  }
}
