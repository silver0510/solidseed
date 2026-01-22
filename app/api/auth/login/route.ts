/**
 * Login API Route Wrapper
 *
 * Wraps Better Auth's native /sign-in/email endpoint with custom logic
 * and response formatting to maintain backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Clone the request so we can read the body twice if needed
    const requestClone = request.clone();
    const body = await requestClone.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call Better Auth's sign-in endpoint
    const result = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
        rememberMe: body.rememberMe || false,
        callbackURL: body.callbackURL || '/dashboard',
      },
    });

    // Better Auth returns user and token data on successful login
    if (result.user && result.token) {
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.name,
          image: result.user.image,
          phone: (result.user as any).phone,
          subscription_tier: result.user.subscription_tier || 'trial',
          trial_expires_at: result.user.trial_expires_at,
        },
      });
    }

    // Handle error cases
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);

    // Handle specific error cases
    const errorMessage = error instanceof Error ? error.message : 'Login failed';

    // Account locked
    if (errorMessage.includes('locked') || errorMessage.includes('too many attempts')) {
      return NextResponse.json(
        { success: false, error: 'Account locked due to too many failed login attempts. Please try again later.' },
        { status: 423 }
      );
    }

    // Invalid credentials
    if (errorMessage.includes('invalid') || errorMessage.includes('not found') || errorMessage.includes('incorrect')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Email not verified
    if (errorMessage.includes('not verified') || errorMessage.includes('verification')) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email before logging in' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
