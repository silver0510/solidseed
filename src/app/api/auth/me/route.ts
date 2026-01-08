/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's information.
 * Validates JWT token and returns user data if session is valid.
 *
 * This endpoint is used by the frontend to:
 * - Check if user is authenticated
 * - Get current user data for profile display
 * - Refresh user subscription tier and trial status
 * - Validate session on page load
 *
 * Request:
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   user: {
 *     id: string,
 *     email: string,
 *     fullName: string,
 *     subscriptionTier: string,
 *     trialExpiresAt: string | null,
 *     isTrial: boolean,
 *     daysRemaining: number | null
 *   }
 * }
 *
 * Response (401 Unauthorized):
 * {
 *   error: "Unauthorized",
 *   message: "Invalid or missing token"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserSubscriptionStatus } from '@/services/session.service';
import { authErrors } from '@/middleware/auth.middleware';

// =============================================================================
// GET /api/auth/me
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Validate session using Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: authErrors.unauthorized.error,
          message: authErrors.unauthorized.message,
        },
        { status: 401 }
      );
    }

    const user = session.user as any;

    // Get subscription status
    const subscriptionStatus = getUserSubscriptionStatus(user);

    // Return user data
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          subscriptionTier: subscriptionStatus.tier,
          trialExpiresAt: user.trial_expires_at || null,
          isTrial: subscriptionStatus.isTrial,
          daysRemaining: subscriptionStatus.daysRemaining,
          emailVerified: user.emailVerified,
          accountStatus: user.account_status || 'active',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve user information',
      },
      { status: 500 }
    );
  }
}
