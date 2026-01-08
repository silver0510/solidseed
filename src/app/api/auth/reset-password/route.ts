/**
 * POST /api/auth/reset-password
 *
 * Completes password reset using token from email
 *
 * Request body:
 * ```json
 * {
 *   "token": "abc123...",
 *   "new_password": "NewSecurePassword123!"
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "message": "Password reset successfully"
 * }
 * ```
 */

import { NextRequest } from 'next/server';
import { handleResetPassword } from '@/controllers/password.controller';

export async function POST(request: NextRequest) {
  return handleResetPassword(request);
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
