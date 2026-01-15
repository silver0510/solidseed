/**
 * Registration API Route Wrapper
 *
 * Wraps Better Auth's native /sign-up/email endpoint with custom logic
 * and response formatting to maintain backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Clone the request so we can read the body twice
    const requestClone = request.clone();
    const body = await requestClone.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call Better Auth's sign-up endpoint with the original request
    const result = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.fullName || body.name || body.full_name || '',
        image: body.image,
        callbackURL: body.callbackURL || '/dashboard',
      },
    });

    // Better Auth returns user data on successful signup
    if (result.user) {
      return NextResponse.json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        userId: result.user.id,
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.name,
          subscription_tier: 'trial',
        },
      });
    }

    // Handle error cases
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific error cases
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';

    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
