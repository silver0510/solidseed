/**
 * Subscription Middleware for Feature-Based Access Control
 *
 * This middleware provides decorators and guards for protecting routes
 * based on user subscription tiers.
 *
 * Usage:
 * - Import and use in Next.js route handlers
 * - Protects API routes based on subscription tier requirements
 * - Provides tier-based access control for features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hasRequiredTier, type Session } from './auth.middleware';

/**
 * Subscription tier levels
 */
export type SubscriptionTier = 'trial' | 'free' | 'pro' | 'enterprise';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Subscription tier requirements
 */
export type TierRequirement = SubscriptionTier | SubscriptionTier[];

/**
 * Handler function signature for protected routes
 */
export type ProtectedHandler<T extends Response = Response> = (
  request: NextRequest,
  session: Session
) => Promise<T> | T;

// =============================================================================
// Middleware Guards
// =============================================================================

/**
 * Creates a middleware that requires a specific subscription tier
 *
 * @param requiredTier - Required tier(s) for access
 *
 * @returns Middleware function
 *
 * @example
 * ```ts
 * import { requireSubscription } from '@/middleware/subscription.middleware';
 *
 * export const GET = requireSubscription('pro')(async (req, session) => {
 *   return Response.json({ data: 'pro feature' });
 * });
 * ```
 */
export function requireSubscription<T extends Response = Response>(
  requiredTier: TierRequirement
) {
  return function (handler: ProtectedHandler<T>) {
    return async (request: NextRequest): Promise<T> => {
      // Validate session
      const session = await getSessionFromRequest(request);

      if (!session) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
          },
          { status: 401 }
        ) as unknown as T;
      }

      // Check account status
      if (!isAccountActive(session)) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Account is not active',
          },
          { status: 403 }
        ) as unknown as T;
      }

      // Check subscription tier
      const userTier = (session.user.subscription_tier || 'free') as SubscriptionTier;
      const allowedTiers = Array.isArray(requiredTier) ? requiredTier : [requiredTier];

      const hasAccess = allowedTiers.some((tier) => hasRequiredTier(userTier, tier));

      if (!hasAccess) {
        return NextResponse.json(
          {
            error: 'Upgrade Required',
            message: `This feature requires ${formatTierRequirement(allowedTiers)} tier or higher`,
            currentTier: userTier,
            requiredTier: allowedTiers,
          },
          { status: 403 }
        ) as unknown as T;
      }

      // Call the actual handler
      return handler(request, session);
    };
  };
}

/**
 * Creates a middleware that requires "pro" tier or higher
 *
 * @param handler - Route handler
 *
 * @returns Protected route handler
 *
 * @example
 * ```ts
 * import { requirePro } from '@/middleware/subscription.middleware';
 *
 * export const GET = requirePro(async (req, session) => {
 *   return Response.json({ data: 'pro feature' });
 * });
 * ```
 */
export function requirePro<T extends Response = Response>(handler: ProtectedHandler<T>) {
  return requireSubscription<T>('pro')(handler);
}

/**
 * Creates a middleware that requires "enterprise" tier
 *
 * @param handler - Route handler
 *
 * @returns Protected route handler
 *
 * @example
 * ```ts
 * import { requireEnterprise } from '@/middleware/subscription.middleware';
 *
 * export const GET = requireEnterprise(async (req, session) => {
 *   return Response.json({ data: 'enterprise feature' });
 * });
 * ```
 */
export function requireEnterprise<T extends Response = Response>(handler: ProtectedHandler<T>) {
  return requireSubscription<T>('enterprise')(handler);
}

/**
 * Creates a middleware that requires active trial (not expired)
 *
 * @param handler - Route handler
 *
 * @returns Protected route handler
 */
export function requireActiveTrial<T extends Response = Response>(handler: ProtectedHandler<T>) {
  return async (request: NextRequest): Promise<T> => {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      ) as unknown as T;
    }

    const userTier = (session.user.subscription_tier || 'free') as SubscriptionTier;
    const trialExpiresAt = (session.user.trial_expires_at as string | null) || null;

    // Check if user is on trial and trial is still active
    if (userTier !== 'trial') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'This feature requires an active trial period',
        },
        { status: 403 }
      ) as unknown as T;
    }

    if (!trialExpiresAt || new Date(trialExpiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: 'Trial Expired',
          message: 'Your trial period has expired',
        },
        { status: 403 }
      ) as unknown as T;
    }

    return handler(request, session);
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Checks if a user's account is active
 *
 * @param session - User session
 *
 * @returns True if account is active
 */
function isAccountActive(session: Session): boolean {
  const userData = session.user as any;

  // Check if account is deleted
  if (userData.is_deleted) {
    return false;
  }

  // Check if account is deactivated
  if (userData.account_status === 'deactivated') {
    return false;
  }

  // Check if account is suspended
  if (userData.account_status === 'suspended') {
    return false;
  }

  // Check if account is locked
  if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
    return false;
  }

  return true;
}

/**
 * Formats tier requirement for error messages
 *
 * @param tiers - Array of required tiers
 *
 * @returns Formatted string
 */
function formatTierRequirement(tiers: SubscriptionTier[]): string {
  if (tiers.length === 0) {
    return '';
  }

  if (tiers.length === 1) {
    return tiers[0] ?? '';
  }

  if (tiers.length === 2) {
    return `${tiers[0] ?? ''} or ${tiers[1] ?? ''}`;
  }

  const last = tiers[tiers.length - 1] ?? '';
  const rest = tiers.slice(0, -1).join(', ');
  return `${rest}, or ${last}`;
}

// =============================================================================
// Route Handler Composers
// =============================================================================

/**
 * Combines auth and subscription requirements
 *
 * @param requiredTier - Required subscription tier
 * @param requireActiveAccount - Whether to require active account status
 *
 * @returns Composed middleware function
 *
 * @example
 * ```ts
 * import { withSubscriptionAccess } from '@/middleware/subscription.middleware';
 *
 * export const GET = withSubscriptionAccess('pro')(async (req, session) => {
 *   return Response.json({ data: 'pro feature' });
 * });
 * ```
 */
export function withSubscriptionAccess<T extends Response = Response>(
  requiredTier?: TierRequirement,
  options?: {
    requireActiveAccount?: boolean;
    allowExpiredTrial?: boolean;
  }
) {
  return function (handler: ProtectedHandler<T>) {
    return async (request: NextRequest): Promise<T> => {
      // Validate session
      const session = await getSessionFromRequest(request);

      if (!session) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
          },
          { status: 401 }
        ) as unknown as T;
      }

      // Check account status if required
      if (options?.requireActiveAccount !== false && !isAccountActive(session)) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Account is not active',
          },
          { status: 403 }
        ) as unknown as T;
      }

      // Check subscription tier if specified
      if (requiredTier) {
        const userTier = (session.user.subscription_tier || 'free') as SubscriptionTier;
        const allowedTiers = Array.isArray(requiredTier) ? requiredTier : [requiredTier];

        const hasAccess = allowedTiers.some((tier) => hasRequiredTier(userTier, tier));

        if (!hasAccess) {
          // Special handling for expired trial
          if (userTier === 'trial' && !options?.allowExpiredTrial) {
            const trialExpiresAt = (session.user.trial_expires_at as string | null) || null;
            if (!trialExpiresAt || new Date(trialExpiresAt) < new Date()) {
              return NextResponse.json(
                {
                  error: 'Trial Expired',
                  message: 'Your trial period has expired. Please upgrade to continue.',
                  currentTier: userTier,
                  requiredTier: allowedTiers,
                },
                { status: 403 }
              ) as unknown as T;
            }
          }

          return NextResponse.json(
            {
              error: 'Upgrade Required',
              message: `This feature requires ${formatTierRequirement(allowedTiers)} tier or higher`,
              currentTier: userTier,
              requiredTier: allowedTiers,
            },
            { status: 403 }
          ) as unknown as T;
        }
      }

      // Call the actual handler
      return handler(request, session);
    };
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Gets subscription info from session
 *
 * @param session - User session
 *
 * @returns Subscription information
 */
export function getSubscriptionInfo(session: Session) {
  const userTier = (session.user.subscription_tier || 'free') as SubscriptionTier;
  const trialExpiresAt = (session.user.trial_expires_at as string | null) || null;

  const isTrial = userTier === 'trial';
  const isTrialExpired = isTrial && trialExpiresAt
    ? new Date(trialExpiresAt) < new Date()
    : false;

  let daysRemaining: number | null = null;

  if (isTrial && trialExpiresAt && !isTrialExpired) {
    const trialEnd = new Date(trialExpiresAt);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    tier: userTier,
    isTrial,
    isTrialExpired,
    daysRemaining,
    trialExpiresAt,
  };
}

/**
 * Checks if session has access to a feature
 *
 * @param session - User session
 * @param requiredTier - Required tier
 *
 * @returns True if has access
 */
export function hasFeatureAccess(
  session: Session | null,
  requiredTier: SubscriptionTier
): boolean {
  if (!session) {
    return false;
  }

  if (!isAccountActive(session)) {
    return false;
  }

  const userTier = (session.user.subscription_tier || 'free') as SubscriptionTier;
  return hasRequiredTier(userTier, requiredTier);
}

// =============================================================================
// Error Response Helpers
// =============================================================================

/**
 * Creates a subscription upgrade required response
 */
export function createUpgradeResponse(
  currentTier: SubscriptionTier,
  requiredTier: TierRequirement
): NextResponse {
  const allowedTiers = Array.isArray(requiredTier) ? requiredTier : [requiredTier];

  return NextResponse.json(
    {
      error: 'Upgrade Required',
      message: `This feature requires ${formatTierRequirement(allowedTiers)} tier or higher`,
      currentTier,
      requiredTier: allowedTiers,
      upgradeUrl: '/pricing',
    },
    { status: 403 }
  );
}

/**
 * Creates a trial expired response
 */
export function createTrialExpiredResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Trial Expired',
      message: 'Your trial period has expired. Please upgrade to continue.',
      upgradeUrl: '/pricing',
    },
    { status: 403 }
  );
}

// =============================================================================
// TypeScript Exports
// =============================================================================

export type { Session };
