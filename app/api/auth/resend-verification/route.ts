/**
 * POST /api/auth/resend-verification
 *
 * Resend verification email endpoint.
 *
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Verification email sent. Please check your inbox."
 * }
 *
 * Response (400 Bad Request): Invalid email or already verified
 * Response (429 Too Many Requests): Rate limit exceeded
 * Response (500 Internal Server Error): Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendVerificationSchema } from '@/lib/validators';
import { validateRequestBody } from '@/lib/validators';
import { resendVerificationEmail } from '@/services/auth.service';

/**
 * POST handler for resending verification email
 */
export async function POST(request: NextRequest) {
  try {
    // Extract client information for logging and rate limiting
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Validate request body
    const { data, error } = await validateRequestBody(request, resendVerificationSchema);

    if (error) {
      return NextResponse.json(error, { status: 400 });
    }

    // Resend verification email
    const result = await resendVerificationEmail(
      data.email,
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

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend verification endpoint error:', error);

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
      'Allow': 'POST, OPTIONS',
    },
  });
}
