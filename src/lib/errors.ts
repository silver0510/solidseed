/**
 * Authentication Error Handling Utilities
 *
 * This module provides standardized error handling for authentication endpoints.
 * It includes error types, formatting, and HTTP status code mapping.
 */

// =============================================================================
// Error Types
// =============================================================================

/**
 * Base authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AuthError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AuthError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AuthError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AuthError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AuthError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AuthError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Account locked error (423)
 */
export class AccountLockedError extends AuthError {
  constructor(message: string = 'Account is locked') {
    super(message, 423, 'ACCOUNT_LOCKED');
    this.name = 'AccountLockedError';
  }
}

// =============================================================================
// Error Response Formatter
// =============================================================================

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
  stack?: string; // Only in development
}

/**
 * Formats an error into a standard response object
 */
export function formatErrorResponse(error: unknown, includeStack: boolean = false): ErrorResponse {
  // Handle AuthError instances
  if (error instanceof AuthError) {
    const response: ErrorResponse = {
      error: error.code,
      message: error.message,
    };

    if (includeStack && error.stack) {
      response.stack = error.stack;
    }

    return response;
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    const response: ErrorResponse = {
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
    };

    if (includeStack && error.stack) {
      response.stack = error.stack;
    }

    return response;
  }

  // Handle unknown errors
  return {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  };
}

/**
 * Gets the appropriate HTTP status code for an error
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AuthError) {
    return error.statusCode;
  }

  // Default to 500 for unknown errors
  return 500;
}

// =============================================================================
// Async Error Handler Wrapper
// =============================================================================

/**
 * Wraps an async handler with error handling
 * Use this in API route handlers to automatically catch and format errors
 */
export function withErrorHandler<T extends Response = Response>(
  handler: () => Promise<T>,
  options?: {
    includeStack?: boolean;
  }
) {
  return async (): Promise<T> => {
    try {
      return await handler();
    } catch (error) {
      const formattedError = formatErrorResponse(error, options?.includeStack);
      const statusCode = getErrorStatusCode(error);

      // Return error response
      return new Response(JSON.stringify(formattedError), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }) as T;
    }
  };
}

// =============================================================================
// Error Logging
// =============================================================================

/**
 * Logs an error with context information
 */
export function logError(error: unknown, context?: {
  endpoint?: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  additionalData?: Record<string, unknown>;
}): void {
  const logData: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    ...context,
  };

  // In production, this would send to a logging service
  // For now, just console.error
  console.error('[Auth Error]', JSON.stringify(logData, null, 2));
}

// =============================================================================
// Common Error Messages
// =============================================================================

/**
 * Standard error messages for authentication scenarios
 */
export const errorMessages = {
  // Registration errors
  emailAlreadyExists: 'An account with this email already exists',
  emailPreviouslyDeleted: 'This email address was previously deleted. Please contact support.',
  accountPendingVerification: 'An account with this email already exists and is pending verification',
  registrationFailed: 'Failed to create account. Please try again',

  // Login errors
  invalidCredentials: 'Invalid email or password',
  emailNotVerified: 'Please verify your email before logging in',
  accountLocked: 'Account is temporarily locked due to multiple failed login attempts',
  accountDeactivated: 'Account has been deactivated',
  loginFailed: 'Login failed. Please try again',

  // Email verification errors
  invalidVerificationToken: 'Invalid verification token',
  tokenExpired: 'Verification token has expired. Please request a new one',
  emailAlreadyVerified: 'Email is already verified. You can now log in',
  verificationFailed: 'Failed to verify email. Please try again',

  // OAuth errors
  oauthFailed: 'OAuth authentication failed',
  oauthAccessDenied: 'Access denied by OAuth provider',
  oauthStateMismatch: 'OAuth state mismatch. Possible CSRF attack',
  oauthCodeExpired: 'OAuth authorization code has expired',
  oauthProviderError: 'OAuth provider returned an error',

  // Session errors
  invalidToken: 'Invalid or expired token',
  missingToken: 'Authentication token is required',
  sessionExpired: 'Session has expired. Please log in again',

  // Account status errors
  accountNotFound: 'Account not found',
  accountSuspended: 'Account has been suspended',
  insufficientPermissions: 'Insufficient permissions to access this resource',
  subscriptionRequired: 'This feature requires an active subscription',

  // Rate limiting errors
  tooManyAttempts: 'Too many attempts. Please try again later',
  tooManyPasswordResets: 'Too many password reset requests. Please try again later',

  // Validation errors
  invalidEmail: 'Invalid email format',
  weakPassword: 'Password does not meet security requirements',
  passwordMismatch: 'Passwords do not match',
  missingRequiredField: 'Required field is missing',
  invalidInput: 'Invalid input data',
} as const;

// =============================================================================
// Error Creation Helpers
// =============================================================================

/**
 * Creates a ValidationError with a formatted message
 */
export function createValidationError(message: string): ValidationError {
  return new ValidationError(message);
}

/**
 * Creates an AuthenticationError with a formatted message
 */
export function createAuthenticationError(message?: string): AuthenticationError {
  return new AuthenticationError(message);
}

/**
 * Creates a ForbiddenError with a formatted message
 */
export function createForbiddenError(message?: string): ForbiddenError {
  return new ForbiddenError(message);
}

/**
 * Creates a ConflictError with a formatted message
 */
export function createConflictError(message: string): ConflictError {
  return new ConflictError(message);
}

/**
 * Creates a RateLimitError with a formatted message
 */
export function createRateLimitError(message?: string): RateLimitError {
  return new RateLimitError(message);
}

/**
 * Creates an AccountLockedError with a formatted message
 */
export function createAccountLockedError(message?: string): AccountLockedError {
  return new AccountLockedError(message);
}
