/**
 * POST /api/auth/change-password
 *
 * Changes password for authenticated user
 *
 * Requires authentication: Authorization header with JWT token
 *
 * Request body:
 * ```json
 * {
 *   "current_password": "OldPassword123!",
 *   "new_password": "NewSecurePassword123!"
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 * ```
 */

import { NextRequest } from 'next/server';
import { handleChangePassword } from '@/controllers/password.controller';
import { getAuthenticatedUser } from '@/middleware/auth.middleware';

export async function POST(request: NextRequest) {
  // Get authenticated user
  const authResult = await getAuthenticatedUser(request);

  if (!authResult.user || !authResult.session) {
    return Response.json(
      {
        error: 'Unauthorized',
        message: authResult.error || 'Authentication required',
      },
      { status: 401 }
    );
  }

  // Handle password change
  return handleChangePassword(request, authResult.user.id);
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}
