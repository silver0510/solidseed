/**
 * Admin Controller for User Management
 *
 * This controller provides admin-only endpoints for:
 * - User account activation/deactivation
 * - Subscription tier management
 * - User subscription information retrieval
 * - Subscription statistics
 *
 * All endpoints require admin authentication and proper authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '../middleware/auth.middleware';
import {
  activateAccount,
  deactivateAccount,
  changeSubscriptionTier,
  getUserSubscriptionInfo,
  getAllUsersSubscriptionInfo,
  getSubscriptionStats,
  type SubscriptionTier,
  type AccountStatus,
} from '../services/subscription.service';

// =============================================================================
// Admin Authorization
// =============================================================================

/**
 * Checks if the current user is an admin
 * For now, this is a simple check. In production, you'd have an admin role in the database.
 */
async function isAdmin(session: any): Promise<boolean> {
  // TODO: Implement proper admin role checking
  // For now, we'll check if the user's email is in a list of admin emails
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  // Check if user's email is in admin list
  if (adminEmails.length > 0) {
    return adminEmails.includes(session.user.email);
  }

  // Fallback: Check if user has enterprise tier (temporary)
  // In production, use proper role-based access control
  return (session.user.subscription_tier as string) === 'enterprise';
}

/**
 * Validates admin authorization
 */
async function requireAdmin(request: NextRequest): Promise<{
  success: boolean;
  session?: any;
  error?: string;
}> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  const adminCheck = await isAdmin(session);

  if (!adminCheck) {
    return {
      success: false,
      error: 'Forbidden: Admin access required',
    };
  }

  return {
    success: true,
    session,
  };
}

// =============================================================================
// User Account Management
// =============================================================================

/**
 * Deactivates a user account
 *
 * PUT /api/admin/users/:userId/deactivate
 */
export async function deactivateUserAccount(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    // Check admin authorization
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          message: authResult.error === 'Unauthorized' ? 'Authentication required' : authResult.error,
        },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (userId === authResult.session?.user?.id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Deactivate account
    const result = await deactivateAccount(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: result.error || 'Failed to deactivate account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to deactivate account' },
      { status: 500 }
    );
  }
}

/**
 * Activates a user account
 *
 * PUT /api/admin/users/:userId/activate
 */
export async function activateUserAccount(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    // Check admin authorization
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          message: authResult.error === 'Unauthorized' ? 'Authentication required' : authResult.error,
        },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Activate account
    const result = await activateAccount(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: result.error || 'Failed to activate account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account activated successfully',
    });
  } catch (error) {
    console.error('Activate account error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to activate account' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Subscription Management
// =============================================================================

/**
 * Gets a user's subscription information
 *
 * GET /api/admin/users/:userId/subscription
 */
export async function getUserSubscription(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    // Check admin authorization
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          message: authResult.error === 'Unauthorized' ? 'Authentication required' : authResult.error,
        },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get subscription info
    const subscriptionInfo = await getUserSubscriptionInfo(userId);

    if (!subscriptionInfo) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscriptionInfo,
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get subscription information' },
      { status: 500 }
    );
  }
}

/**
 * Changes a user's subscription tier
 *
 * PUT /api/admin/users/:userId/subscription
 *
 * Body: { tier: 'trial' | 'free' | 'pro' | 'enterprise' }
 */
export async function changeUserSubscription(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    // Check admin authorization
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          message: authResult.error === 'Unauthorized' ? 'Authentication required' : authResult.error,
        },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => null);

    if (!body || !body.tier) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Subscription tier is required' },
        { status: 400 }
      );
    }

    const newTier = body.tier as SubscriptionTier;

    // Validate tier
    const validTiers: SubscriptionTier[] = ['trial', 'free', 'pro', 'enterprise'];

    if (!validTiers.includes(newTier)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Invalid tier. Must be one of: ${validTiers.join(', ')}` },
        { status: 400 }
      );
    }

    // Change subscription tier
    const result = await changeSubscriptionTier(userId, newTier);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: result.error || 'Failed to change subscription tier' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Subscription tier changed to ${newTier}`,
      data: {
        userId,
        newTier,
      },
    });
  } catch (error) {
    console.error('Change subscription error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to change subscription tier' },
      { status: 500 }
    );
  }
}

// =============================================================================
// User Listing and Statistics
// =============================================================================

/**
 * Gets all users with subscription information
 *
 * GET /api/admin/users
 *
 * Query: ?limit=50&offset=0
 */
export async function getAllUsers(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authorization
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          message: authResult.error === 'Unauthorized' ? 'Authentication required' : authResult.error,
        },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Offset must be 0 or greater' },
        { status: 400 }
      );
    }

    // Get all users
    const users = await getAllUsersSubscriptionInfo(limit, offset);

    return NextResponse.json({
      success: true,
      data: users,
      meta: {
        limit,
        offset,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get users' },
      { status: 500 }
    );
  }
}

/**
 * Gets subscription statistics
 *
 * GET /api/admin/stats/subscription
 */
export async function getSubscriptionStatistics(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Check admin authorization
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          message: authResult.error === 'Unauthorized' ? 'Authentication required' : authResult.error,
        },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    // Get statistics
    const stats = await getSubscriptionStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get subscription statistics' },
      { status: 500 }
    );
  }
}
