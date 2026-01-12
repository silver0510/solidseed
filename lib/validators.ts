/**
 * Input Validation Schemas for Authentication API
 *
 * This module provides Zod validation schemas for all authentication endpoints.
 * Zod is used for runtime type validation and parsing.
 */

import { z } from 'zod';

// =============================================================================
// Registration Validation
// =============================================================================

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// =============================================================================
// Login Validation
// =============================================================================

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z
    .boolean()
    .optional()
    .default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// =============================================================================
// Email Verification Validation
// =============================================================================

/**
 * Email verification request schema
 */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .trim(),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Resend verification email schema
 */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

// =============================================================================
// Password Reset Validation
// =============================================================================

/**
 * Forgot password request schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password request schema
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required')
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// =============================================================================
// Password Change Validation
// =============================================================================

/**
 * Change password request schema (authenticated)
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// =============================================================================
// OAuth Validation
// =============================================================================

/**
 * OAuth callback schema
 */
export const oauthCallbackSchema = z.object({
  code: z
    .string()
    .min(1, 'Authorization code is required')
    .trim(),
  state: z
    .string()
    .optional(),
  error: z
    .string()
    .optional(),
  error_description: z
    .string()
    .optional(),
});

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

// =============================================================================
// Validation Error Helper
// =============================================================================

/**
 * Formats Zod validation errors into a consistent response format
 */
export function formatValidationError(error: z.ZodError): {
  error: string;
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  // Use .issues (primary) or .errors (alias) with defensive fallback
  const issues = error.issues || error.errors || [];
  const details = issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    error: 'Validation Error',
    message: 'Invalid input data',
    details,
  };
}

/**
 * Validates request body against a schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error?: ReturnType<typeof formatValidationError> }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null as any, error: formatValidationError(error) };
    }
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return {
        data: null as any,
        error: {
          error: 'Validation Error',
          message: 'Invalid JSON in request body',
          details: [{ field: 'body', message: error.message }],
        },
      };
    }
    throw error;
  }
}

/**
 * Validates request URL parameters against a schema
 */
export function validateRequestParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data: T; error?: ReturnType<typeof formatValidationError> } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null as any, error: formatValidationError(error) };
    }
    throw error;
  }
}
