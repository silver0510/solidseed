/**
 * POST /api/auth/logout
 *
 * Logout endpoint that:
 * 1. Validates JWT token from Authorization header
 * 2. Extracts user information from token
 * 3. Logs logout event to auth_logs table
 * 4. Returns success response
 *
 * Note: JWT tokens are stateless and cannot be invalidated on the server.
 * The token remains valid until it expires. Security is maintained by:
 * - Short token expiration (3 days default, 30 days with remember me)
 * - Session validation on every request
 * - Checking user status (active/deactivated/locked)
 *
 * Client-side handling:
 * - Clear token from localStorage
 * - Redirect to /login page
 *
 * Request:
 * POST /api/auth/logout
 * Headers: Authorization: Bearer <token>
 * Body: {}
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   message: "Logged out successfully"
 * }
 *
 * Response (401 Unauthorized):
 * {
 *   error: "Unauthorized",
 *   message: "Invalid or missing token"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logoutUser } from '@/services/session.service';
import { authErrors } from '@/middleware/auth.middleware';

// =============================================================================
// POST /api/auth/logout
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Validate session using Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: authErrors.unauthorized.error,
          message: authErrors.unauthorized.message,
        },
        { status: 401 }
      );
    }

    // Get request metadata for logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     null;
    const userAgent = request.headers.get('user-agent') || null;

    // Log logout event
    const result = await logoutUser(
      session.user.id,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to logout',
        },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred during logout',
      },
      { status: 500 }
    );
  }
}
