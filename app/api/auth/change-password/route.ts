/**
 * POST /api/auth/change-password
 *
 * Changes password for authenticated user
 *
 * Requires authentication: Authorization header with JWT token
 *
 * Request body:
 * {
 *   "currentPassword": "OldPassword123!",
 *   "newPassword": "NewSecurePassword123!"
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 *
 * Response (400 Bad Request): Invalid passwords
 * Response (401 Unauthorized): Not authenticated
 * Response (500 Internal Server Error): Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { changePassword } from '@/services/auth.service';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

    let userId: string;
    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }

    // Extract client information
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Parse and validate request body
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: validation.error.issues[0]?.message || 'Invalid request data',
        },
        { status: 400 }
      );
    }

    // Change password
    const result = await changePassword(
      userId,
      validation.data.currentPassword,
      validation.data.newPassword,
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
    console.error('Change password endpoint error:', error);

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
