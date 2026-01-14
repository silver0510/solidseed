/**
 * Email Verification API Route Wrapper
 *
 * Wraps Better Auth's native verify-email endpoint
 * Handles email verification token validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from query parameters
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Call Better Auth's verifyEmail endpoint
    const result = await auth.api.verifyEmail({
      query: { token },
    });

    // Check if verification was successful
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        user: result.user,
      });
    }

    // If result is falsy, verification failed
    return NextResponse.json(
      { success: false, error: 'Invalid or expired verification token' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Email verification error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Email verification failed';

    // Handle specific error cases
    if (errorMessage.includes('expired')) {
      return NextResponse.json(
        { success: false, error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('invalid') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
