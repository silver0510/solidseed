/**
 * GET /api/auth/verify-email?token=xxx
 * POST /api/auth/verify-email
 *
 * Email verification endpoint using a verification token.
 *
 * GET Query Parameters:
 * - token: verification token from email link
 *
 * POST Request Body:
 * {
 *   "token": "verification-token"
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Email verified successfully",
 *   "redirect": "/login"
 * }
 *
 * Response (400 Bad Request): Invalid or expired token
 * Response (500 Internal Server Error): Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailSchema } from '@/lib/validators';
import { validateRequestBody } from '@/lib/validators';
import { verifyEmail } from '@/services/auth.service';

/**
 * GET handler for email verification (from email link)
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Verification token is required',
        },
        { status: 400 }
      );
    }

    // Verify the email token
    const result = await verifyEmail(token);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: result.message,
        },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: result.message,
        redirect: result.redirect,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification endpoint error:', error);

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
 * POST handler for email verification (from API call)
 */
export async function POST(request: NextRequest) {
  try {
    let token: string | undefined;

    // Try to get token from query parameters first (for backward compatibility)
    const { searchParams } = new URL(request.url);
    token = searchParams.get('token') || undefined;

    // If not in query params, try to get from request body
    if (!token) {
      const { data, error } = await validateRequestBody(request, verifyEmailSchema);

      if (error) {
        return NextResponse.json(error, { status: 400 });
      }

      token = data.token;
    }

    if (!token) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Verification token is required',
        },
        { status: 400 }
      );
    }

    // Verify the email token
    const result = await verifyEmail(token);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: result.message,
        },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: result.message,
        redirect: result.redirect,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification endpoint error:', error);

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
      'Allow': 'GET, POST, OPTIONS',
    },
  });
}
