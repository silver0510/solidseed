/**
 * POST /api/auth/reset-password
 *
 * Resets user password with a valid reset token
 *
 * Request body:
 * {
 *   "token": "reset-token",
 *   "password": "newPassword123!"
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Password has been reset successfully"
 * }
 *
 * Response (400 Bad Request): Invalid token or password
 * Response (500 Internal Server Error): Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPassword } from '@/services/auth.service';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Extract client information
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Parse and validate request body
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: validation.error.issues[0]?.message || 'Invalid request data',
        },
        { status: 400 }
      );
    }

    // Reset password
    const result = await resetPassword(
      validation.data.token,
      validation.data.password,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: result.message,
        },
        { status: 400 }
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
    console.error('Reset password endpoint error:', error);

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
