/**
 * Password Management Controller for Korella CRM
 *
 * This module handles HTTP requests for password management operations:
 * - Forgot password (request password reset)
 * - Reset password (complete password reset with token)
 * - Change password (for authenticated users)
 *
 * Works with Next.js App Router route handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPasswordResetToken,
  completePasswordReset,
  changePassword,
} from '../services/password.service';
import {
  checkRateLimit,
  passwordResetKey,
  createRateLimitHeaders,
  createRateLimitErrorResponse,
  extractIpAddress,
} from '../lib/rate-limit';
import { rateLimitConfigs } from '../lib/rate-limit';

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * Forgot password request body
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request body
 */
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

/**
 * Change password request body
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  retryAfter?: number;
}

/**
 * Success response
 */
export interface SuccessResponse {
  success: boolean;
  message: string;
}

// =============================================================================
// Forgot Password Handler
// =============================================================================

/**
 * POST /api/auth/forgot-password
 *
 * Initiates password reset flow by sending reset email
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
export async function handleForgotPassword(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ApiErrorResponse>> {
  try {
    // Parse request body
    const body = (await request.json()) as ForgotPasswordRequest;
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Valid email address is required',
        },
        { status: 400 }
      );
    }

    // Check rate limit
    const ipAddress = extractIpAddress(request.headers) || 'unknown';
    const rateLimitKey = passwordResetKey(email);
    const rateLimitResult = await checkRateLimit(
      `${rateLimitKey}:${ipAddress}`,
      rateLimitConfigs.passwordReset
    );

    if (!rateLimitResult.allowed) {
      const errorResponse = createRateLimitErrorResponse(rateLimitResult);
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      });
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create password reset token
    // Note: This returns null if user not found, but we don't reveal that
    await createPasswordResetToken(email, ipAddress, userAgent);

    // Return generic success message (security best practice)
    const response = NextResponse.json(
      {
        success: true,
        message: 'If account exists, reset link sent',
      },
      {
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );

    return response;
  } catch (error) {
    console.error('Error in forgot password handler:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to process password reset request',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// Reset Password Handler
// =============================================================================

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
export async function handleResetPassword(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ApiErrorResponse>> {
  try {
    // Parse request body
    const body = (await request.json()) as ResetPasswordRequest;
    const { token, new_password } = body;

    // Validate token
    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Valid reset token is required',
        },
        { status: 400 }
      );
    }

    // Validate new password
    if (!new_password || typeof new_password !== 'string') {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'New password is required',
        },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = extractIpAddress(request.headers) || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Complete password reset
    const result = await completePasswordReset(
      token,
      new_password,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: result.error || 'Failed to reset password',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    console.error('Error in reset password handler:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to reset password',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// Change Password Handler
// =============================================================================

/**
 * POST /api/auth/change-password
 *
 * Changes password for authenticated user
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
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
export async function handleChangePassword(
  request: NextRequest,
  userId: string
): Promise<NextResponse<SuccessResponse | ApiErrorResponse>> {
  try {
    // Parse request body
    const body = (await request.json()) as ChangePasswordRequest;
    const { current_password, new_password } = body;

    // Validate current password
    if (!current_password || typeof current_password !== 'string') {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Current password is required',
        },
        { status: 400 }
      );
    }

    // Validate new password
    if (!new_password || typeof new_password !== 'string') {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'New password is required',
        },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    if (current_password === new_password) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'New password must be different from current password',
        },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = extractIpAddress(request.headers) || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Change password
    const result = await changePassword(
      userId,
      current_password,
      new_password,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: result.error || 'Failed to change password',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error in change password handler:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to change password',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// Error Response Helpers
// =============================================================================

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  status: number = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error,
      message,
    },
    { status }
  );
}

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(
  errors: string[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: 'Validation Error',
      message: errors.join(', '),
    },
    { status: 400 }
  );
}

/**
 * Creates a success response
 */
export function createSuccessResponse(
  message: string,
  status: number = 200
): NextResponse<SuccessResponse> {
  return NextResponse.json(
    {
      success: true,
      message,
    },
    { status }
  );
}
