/**
 * POST /api/auth/login
 *
 * User login endpoint with email and password.
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "rememberMe": false
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "token": "jwt-token",
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "fullName": "John Doe",
 *     "subscriptionTier": "trial",
 *     "trialExpiresAt": "2024-01-22T00:00:00Z"
 *   }
 * }
 *
 * Response (400 Bad Request): Validation error
 * Response (401 Unauthorized): Invalid credentials
 * Response (403 Forbidden): Account locked, deactivated, or email not verified
 * Response (429 Too Many Requests): Rate limit exceeded
 * Response (500 Internal Server Error): Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validators';
import { validateRequestBody } from '@/lib/validators';
import { loginUser } from '@/services/auth.service';

/**
 * POST handler for user login
 */
export async function POST(request: NextRequest) {
  try {
    // Extract client information for logging and security
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Validate request body
    const { data, error } = await validateRequestBody(request, loginSchema);

    if (error) {
      return NextResponse.json(error, { status: 400 });
    }

    // Attempt to login the user
    const result = await loginUser(
      data.email,
      data.password,
      data.rememberMe,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      // Determine appropriate status code based on error message
      let statusCode = 401; // Default to Unauthorized

      const message = result.message.toLowerCase();

      if (message.includes('verify your email')) {
        statusCode = 403; // Forbidden - email not verified
      } else if (message.includes('locked') || message.includes('deactivated')) {
        statusCode = 403; // Forbidden - account issue
      }

      return NextResponse.json(
        {
          error: statusCode === 403 ? 'Forbidden' : 'Unauthorized',
          message: result.message,
        },
        { status: statusCode }
      );
    }

    // Return success response with token and user data
    return NextResponse.json(
      {
        success: true,
        message: result.message,
        token: result.token,
        user: result.user,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login endpoint error:', error);

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
