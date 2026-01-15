/**
 * Logout API Route Wrapper
 *
 * Wraps Better Auth's native /sign-out endpoint with custom logic
 * and response formatting to maintain backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Call Better Auth's sign-out endpoint
    const result = await auth.api.signOut({
      headers: request.headers,
    });

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);

    // Even if logout fails, we should consider it successful
    // to prevent users from being stuck in a logged-in state
    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
  }
}
