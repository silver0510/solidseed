/**
 * POST /api/auth/forgot-password
 *
 * Initiates password reset flow by sending reset email
 *
 * Rate limited: 3 requests per hour per email
 *
 * Request body:
 * ```json
 * {
 *   "email": "user@example.com"
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "message": "If account exists, reset link sent"
 * }
 * ```
 */

import { NextRequest } from 'next/server';
import { handleForgotPassword } from '@/controllers/password.controller';

export async function POST(request: NextRequest) {
  return handleForgotPassword(request);
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
