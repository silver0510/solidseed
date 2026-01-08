/**
 * GET /api/auth/me
 *
 * Get current authenticated user endpoint.
 *
 * Headers:
 * Authorization: Bearer <jwt-token>
 *
 * Response (200 OK):
 * {
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "fullName": "John Doe",
 *     "subscriptionTier": "trial",
 *     "trialExpiresAt": "2024-01-22T00:00:00Z",
 *     "emailVerified": true,
 *     "accountStatus": "active"
 *   }
 * }
 *
 * Response (401 Unauthorized): Invalid or missing token
 * Response (500 Internal Server Error): Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, createAuthResponse } from '@/middleware/auth.middleware';
import { getUserSubscriptionStatus } from '@/services/auth.service';

/**
 * GET handler for retrieving current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from request
    const session = await getSessionFromRequest(request);

    if (!session) {
      return createAuthResponse('unauthorized');
    }

    // Get user subscription status
    const subscriptionStatus = getUserSubscriptionStatus(session.user as any);

    // Return user data
    return NextResponse.json(
      {
        user: {
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.name,
          subscriptionTier: subscriptionStatus.tier,
          trialExpiresAt: (session.user as any).trial_expires_at || null,
          emailVerified: session.user.emailVerified,
          accountStatus: (session.user as any).account_status || 'active',
          isTrial: subscriptionStatus.isTrial,
          isTrialExpired: subscriptionStatus.isTrialExpired,
          trialDaysRemaining: subscriptionStatus.daysRemaining,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get current user endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, OPTIONS',
    },
  });
}
