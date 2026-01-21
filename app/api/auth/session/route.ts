/**
 * Get Current Session/User
 *
 * Returns the currently authenticated user from Better Auth session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get session from Better Auth (checks cookies automatically)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          user: null
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.name,
        subscription_tier: (session.user as any).subscription_tier || 'free',
        trial_expires_at: (session.user as any).trial_expires_at,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get session',
        user: null
      },
      { status: 500 }
    );
  }
}
