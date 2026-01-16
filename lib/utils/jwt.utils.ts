/**
 * JWT Utility Functions
 *
 * This module provides helper functions for JWT token operations:
 * - Token extraction from Authorization header
 * - Token validation and verification
 * - Token payload parsing
 * - Token expiration checking
 * - Token refresh helpers
 *
 * These utilities work with Better Auth's JWT implementation
 * and provide additional functionality for session management.
 */

import { securityConstants } from '../../config/database';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * JWT token payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  subscriptionTier: string;
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
  rememberMe?: boolean; // Whether "remember me" was enabled
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: {
    code: 'INVALID_FORMAT' | 'EXPIRED' | 'MALFORMED' | 'MISSING';
    message: string;
  };
}

// =============================================================================
// Token Extraction
// =============================================================================

/**
 * Extracts JWT token from Authorization header
 *
 * @param authHeader - Authorization header value (format: "Bearer <token>")
 *
 * @returns Token string or null if not found
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Check if header starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  // Extract token (remove "Bearer " prefix)
  const token = authHeader.substring(7).trim();

  // Check if token is empty
  if (!token) {
    return null;
  }

  return token;
}

/**
 * Extracts token from NextRequest headers
 *
 * @param headers - Next.js Request headers object
 *
 * @returns Token string or null if not found
 */
export function extractTokenFromRequest(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  return extractTokenFromHeader(authHeader);
}

// =============================================================================
// Token Validation
// =============================================================================

/**
 * Checks if a token string is properly formatted
 *
 * @param token - JWT token string
 *
 * @returns True if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  // JWT tokens have 3 parts separated by dots: header.payload.signature
  const parts = token.split('.');

  if (parts.length !== 3) {
    return false;
  }

  // Check that each part is non-empty
  return parts.every((part) => part.length > 0);
}

/**
 * Parses JWT payload without verifying signature
 * WARNING: This does not verify the token signature!
 * Use only for extracting data before signature verification.
 *
 * @param token - JWT token string
 *
 * @returns Parsed payload or null if invalid
 */
export function parseJWTPayload(token: string): JWTPayload | null {
  try {
    if (!isValidTokenFormat(token)) {
      return null;
    }

    // Extract payload (second part)
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      return null;
    }

    // Add padding if needed
    const paddedBase64 = payloadBase64 + '='.repeat((4 - payloadBase64.length % 4) % 4);

    // Decode base64url
    const base64 = paddedBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    const payload = JSON.parse(jsonPayload);

    return {
      userId: payload.sub || payload.userId,
      email: payload.email,
      name: payload.name,
      subscriptionTier: payload.subscriptionTier || 'trial',
      iat: payload.iat,
      exp: payload.exp,
      rememberMe: payload.rememberMe || false,
    };
  } catch (error) {
    console.error('Failed to parse JWT payload:', error);
    return null;
  }
}

/**
 * Checks if JWT token is expired based on exp claim
 *
 * @param payload - Parsed JWT payload
 *
 * @returns True if token is expired
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  return payload.exp < now;
}

/**
 * Gets token expiration time in milliseconds
 *
 * @param payload - Parsed JWT payload
 *
 * @returns Expiration timestamp in milliseconds
 */
export function getTokenExpirationTime(payload: JWTPayload): number {
  return payload.exp * 1000;
}

/**
 * Gets token issued time in milliseconds
 *
 * @param payload - Parsed JWT payload
 *
 * @returns Issued timestamp in milliseconds
 */
export function getTokenIssuedTime(payload: JWTPayload): number {
  return payload.iat * 1000;
}

/**
 * Gets time remaining until token expires
 *
 * @param payload - Parsed JWT payload
 *
 * @returns Object with time remaining information
 */
export function getTokenTimeRemaining(payload: JWTPayload): {
  expired: boolean;
  millisecondsRemaining: number;
  secondsRemaining: number;
  minutesRemaining: number;
  hoursRemaining: number;
  daysRemaining: number;
  expiresAt: Date;
} {
  const now = Date.now();
  const expiresAt = getTokenExpirationTime(payload);
  const diff = expiresAt - now;

  const expired = diff <= 0;
  const millisecondsRemaining = Math.max(0, diff);
  const secondsRemaining = Math.max(0, Math.floor(diff / 1000));
  const minutesRemaining = Math.max(0, Math.floor(diff / (1000 * 60)));
  const hoursRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const daysRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));

  return {
    expired,
    millisecondsRemaining,
    secondsRemaining,
    minutesRemaining,
    hoursRemaining,
    daysRemaining,
    expiresAt: new Date(expiresAt),
  };
}

// =============================================================================
// Token Generation Helpers
// =============================================================================

/**
 * Calculates token expiration time based on "remember me" preference
 *
 * @param rememberMe - Whether user chose "remember me"
 *
 * @returns Expiration timestamp in seconds (Unix timestamp)
 */
export function calculateTokenExpiration(rememberMe: boolean): number {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const expirationDays = rememberMe
    ? securityConstants.EXTENDED_JWT_EXPIRATION_DAYS // 30 days
    : securityConstants.DEFAULT_JWT_EXPIRATION_DAYS; // 3 days

  const secondsUntilExpiration = expirationDays * 24 * 60 * 60;
  return now + secondsUntilExpiration;
}

/**
 * Gets default expiration time (3 days)
 *
 * @returns Expiration timestamp in seconds
 */
export function getDefaultTokenExpiration(): number {
  return calculateTokenExpiration(false);
}

/**
 * Gets extended expiration time for "remember me" (30 days)
 *
 * @returns Expiration timestamp in seconds
 */
export function getExtendedTokenExpiration(): number {
  return calculateTokenExpiration(true);
}

// =============================================================================
// Token Information
// =============================================================================

/**
 * Gets token type based on expiration time
 *
 * @param payload - Parsed JWT payload
 *
 * @returns Token type description
 */
export function getTokenType(payload: JWTPayload): {
  type: 'default' | 'extended' | 'unknown';
  description: string;
} {
  const now = Math.floor(Date.now() / 1000);
  const tokenLifetime = payload.exp - payload.iat;
  const defaultLifetime = securityConstants.DEFAULT_JWT_EXPIRATION_DAYS * 24 * 60 * 60;
  const extendedLifetime = securityConstants.EXTENDED_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

  // Allow some tolerance (±1 minute) for comparison
  const tolerance = 60;

  if (Math.abs(tokenLifetime - extendedLifetime) <= tolerance) {
    return {
      type: 'extended',
      description: 'Extended session (30 days)',
    };
  }

  if (Math.abs(tokenLifetime - defaultLifetime) <= tolerance) {
    return {
      type: 'default',
      description: 'Default session (3 days)',
    };
  }

  return {
    type: 'unknown',
    description: 'Unknown token type',
  };
}

/**
 * Checks if token is an extended session ("remember me")
 *
 * @param payload - Parsed JWT payload
 *
 * @returns True if token is extended session
 */
export function isExtendedSession(payload: JWTPayload): boolean {
  return getTokenType(payload).type === 'extended' || payload.rememberMe === true;
}

// =============================================================================
// Error Messages
// =============================================================================

/**
 * Gets user-friendly error message for token validation failures
 *
 * @param errorCode - Token validation error code
 *
 * @returns User-friendly error message
 */
export function getTokenErrorMessage(errorCode: 'INVALID_FORMAT' | 'EXPIRED' | 'MALFORMED' | 'MISSING'): string {
  const messages: Record<string, string> = {
    INVALID_FORMAT: 'Invalid token format',
    EXPIRED: 'Session expired. Please login again',
    MALFORMED: 'Invalid token',
    MISSING: 'Authentication required',
  };

  return messages[errorCode] || 'Invalid token';
}

/**
 * Gets HTTP status code for token validation errors
 *
 * @param errorCode - Token validation error code
 *
 * @returns HTTP status code
 */
export function getTokenErrorCode(errorCode: 'INVALID_FORMAT' | 'EXPIRED' | 'MALFORMED' | 'MISSING'): 401 | 400 {
  if (errorCode === 'MISSING') {
    return 401;
  }

  return 401;
}
