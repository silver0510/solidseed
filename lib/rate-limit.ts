/**
 * Rate Limiting Utilities for SolidSeed CRM
 *
 * This module provides rate limiting functionality for API endpoints.
 * Uses in-memory storage with Redis as an optional backend.
 *
 * Environment Variables Required:
 * - REDIS_URL: Redis connection string (optional, falls back to in-memory)
 */

// =============================================================================
// Rate Limit Storage
// =============================================================================

/**
 * In-memory rate limit store (fallback when Redis is not available)
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * Cleans up expired entries from in-memory store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.resetAt < now) {
      inMemoryStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

// =============================================================================
// Rate Limit Interface
// =============================================================================

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  max: number; // Maximum number of requests
  window: number; // Time window in seconds
}

// =============================================================================
// Rate Limit Functions
// =============================================================================

/**
 * Checks if a request is within rate limit
 *
 * @param key - Unique identifier for the rate limit (e.g., IP address, email)
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = config.window * 1000;
  const resetAt = new Date(now + windowMs);

  // Try to get existing entry
  let entry = inMemoryStore.get(key);

  // If entry doesn't exist or is expired, create new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    inMemoryStore.set(key, entry);

    return {
      allowed: true,
      limit: config.max,
      remaining: config.max - 1,
      resetAt,
    };
  }

  // Increment count
  entry.count += 1;
  inMemoryStore.set(key, entry);

  const remaining = Math.max(0, config.max - entry.count);
  const allowed = entry.count <= config.max;

  return {
    allowed,
    limit: config.max,
    remaining,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Resets rate limit for a specific key
 *
 * @param key - Unique identifier for the rate limit
 */
export async function resetRateLimit(key: string): Promise<void> {
  inMemoryStore.delete(key);
}

/**
 * Gets current rate limit status without incrementing
 *
 * @param key - Unique identifier for the rate limit
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  const entry = inMemoryStore.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();

  // If entry is expired, return null
  if (entry.resetAt < now) {
    inMemoryStore.delete(key);
    return null;
  }

  return {
    allowed: entry.count <= config.max,
    limit: config.max,
    remaining: Math.max(0, config.max - entry.count),
    resetAt: new Date(entry.resetAt),
  };
}

// =============================================================================
// Rate Limit Key Generators
// =============================================================================

/**
 * Generates a rate limit key for password reset requests by email
 *
 * @param email - User email address
 * @returns Rate limit key
 */
export function passwordResetKey(email: string): string {
  return `password-reset:${email}`;
}

/**
 * Generates a rate limit key for login attempts by IP address
 *
 * @param ip - IP address
 * @returns Rate limit key
 */
export function loginAttemptKey(ip: string): string {
  return `login-attempt:${ip}`;
}

/**
 * Generates a rate limit key for email verification requests by email
 *
 * @param email - User email address
 * @returns Rate limit key
 */
export function emailVerificationKey(email: string): string {
  return `email-verification:${email}`;
}

/**
 * Generates a rate limit key for generic API requests by IP
 *
 * @param ip - IP address
 * @param endpoint - API endpoint path
 * @returns Rate limit key
 */
export function apiRateLimitKey(ip: string, endpoint: string): string {
  return `api:${endpoint}:${ip}`;
}

// =============================================================================
// Rate Limit Middleware Helpers
// =============================================================================

/**
 * Creates a rate limit error response
 */
export function createRateLimitErrorResponse(result: RateLimitResult) {
  return {
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Try again after ${result.resetAt.toISOString()}`,
    retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  };
}

/**
 * Sets rate limit headers on a response
 *
 * @param result - Rate limit check result
 * @returns Headers object with rate limit information
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };
}

// =============================================================================
// Predefined Rate Limit Configurations
// =============================================================================

/**
 * Standard rate limit configurations
 */
export const rateLimitConfigs = {
  // Password reset: 3 requests per hour per email
  passwordReset: {
    max: 3,
    window: 3600, // 1 hour in seconds
  },

  // Login attempts: 10 requests per minute per IP
  loginAttempt: {
    max: 10,
    window: 60, // 1 minute in seconds
  },

  // Email verification: 3 requests per hour per email
  emailVerification: {
    max: 3,
    window: 3600, // 1 hour in seconds
  },

  // General API: 100 requests per minute per IP
  apiGeneral: {
    max: 100,
    window: 60, // 1 minute in seconds
  },

  // Strict API: 10 requests per minute per IP
  apiStrict: {
    max: 10,
    window: 60, // 1 minute in seconds
  },
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extracts IP address from request headers
 *
 * @param headers - Request headers
 * @returns IP address or null
 */
export function extractIpAddress(headers: Headers): string | null {
  // Check common headers for IP address
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : null;
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return null;
}

/**
 * Creates a rate limit key combining multiple factors
 *
 * @param parts - Parts to combine into the key
 * @returns Rate limit key
 */
export function createRateLimitKey(...parts: string[]): string {
  return parts.join(':');
}
