/**
 * POST /api/auth/register
 *
 * User registration endpoint with email and password.
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "fullName": "John Doe"
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Check your email to verify your account",
 *   "userId": "uuid"
 * }
 *
 * Response (400 Bad Request):
 * {
 *   "error": "Validation Error",
 *   "message": "Invalid input data",
 *   "details": [...]
 * }
 *
 * Response (409 Conflict):
 * {
 *   "error": "Conflict",
 *   "message": "An account with this email already exists"
 * }
 *
 * Response (500 Internal Server Error):
 * {
 *   "error": "Internal Server Error",
 *   "message": "Failed to create account"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validators';
import { validateRequestBody } from '@/lib/validators';
import { registerUser } from '@/services/auth.service';

/**
 * POST handler for user registration
 */
export async function POST(request: NextRequest) {
  try {
    // Extract client information for logging and security
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Validate request body
    const { data, error } = await validateRequestBody(request, registerSchema);

    if (error) {
      return NextResponse.json(error, { status: 400 });
    }

    // Attempt to register the user
    const result = await registerUser(
      data.email,
      data.password,
      data.fullName,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      // Determine appropriate status code
      const statusCode = result.message.includes('already exists')
        ? 409 // Conflict
        : 400; // Bad Request

      return NextResponse.json(
        {
          error: statusCode === 409 ? 'Conflict' : 'Bad Request',
          message: result.message,
        },
        { status: statusCode }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: result.message,
        userId: result.userId,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Registration endpoint error:', error);

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
