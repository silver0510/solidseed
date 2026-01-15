/**
 * Resend Verification Email API Route Wrapper
 *
 * Wraps Better Auth's native send-verification-email endpoint
 * Allows users to request a new verification email
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Call Better Auth's sendVerificationEmail endpoint
    const result = await auth.api.sendVerificationEmail({
      body: {
        email: body.email,
        callbackURL: body.callbackURL || '/dashboard',
      },
    });

    // Check if email was sent successfully
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send verification email' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email';

    // Handle specific error cases
    if (errorMessage.includes('UNVERIFIED_EMAIL')) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
