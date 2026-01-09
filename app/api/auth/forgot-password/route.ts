/**
 * POST /api/auth/forgot-password
 *
 * Initiates password reset flow by sending reset email
 *
 * Request body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "If an account exists with this email, a password reset link has been sent."
 * }
 *
 * Response (400 Bad Request): Invalid email
 * Response (500 Internal Server Error): Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requestPasswordReset } from '@/services/auth.service';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    // Extract client information
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Parse and validate request body
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    // Request password reset
    const result = await requestPasswordReset(
      validation.data.email,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: result.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}
