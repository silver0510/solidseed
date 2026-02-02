/**
 * API Utility Functions
 *
 * Shared utilities for frontend API calls across all features.
 * Provides SSR-compatible base URL handling, error handling, and query string building.
 *
 * @module lib/api/utils
 */

// =============================================================================
// BASE URL HANDLING
// =============================================================================

/**
 * Get the base URL for API requests
 *
 * Returns empty string for client-side (relative URLs work)
 * Returns full URL for server-side (required for SSR)
 *
 * @returns Base URL string (empty for client-side, full URL for server-side)
 *
 * @example
 * ```typescript
 * const baseUrl = getBaseUrl();
 * const response = await fetch(`${baseUrl}/api/clients`);
 * ```
 */
export function getBaseUrl(): string {
  // In browser, use relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }
  // On server, use environment variable or default
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Handle API response and throw error if not ok
 *
 * @template T The expected response type
 * @param response - Fetch Response object
 * @returns Parsed JSON response
 * @throws {Error} When response is not ok (status >= 400)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients');
 * const data = await handleResponse<Client[]>(response);
 * ```
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// =============================================================================
// QUERY STRING BUILDING
// =============================================================================

/**
 * Build query string from params with support for arrays
 *
 * Filters out undefined, null, and empty string values.
 * Supports arrays by adding multiple parameters with the same key.
 *
 * @param params - Record of query parameters
 * @returns Query string with leading '?' or empty string
 *
 * @example
 * ```typescript
 * // Simple params
 * buildQueryString({ search: 'john', limit: 10 })
 * // Returns: "?search=john&limit=10"
 *
 * // Array params
 * buildQueryString({ tags: ['vip', 'hot-lead'] })
 * // Returns: "?tags=vip&tags=hot-lead"
 *
 * // Mixed params
 * buildQueryString({ search: 'jane', tags: ['buyer'], limit: 20 })
 * // Returns: "?search=jane&tags=buyer&limit=20"
 * ```
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // Skip undefined, null, and empty string values
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Handle arrays by adding multiple params with same key
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// =============================================================================
// FETCH OPTIONS
// =============================================================================

/**
 * Default fetch options for API calls
 *
 * Includes credentials for session cookie handling.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients', {
 *   ...defaultFetchOptions,
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export const defaultFetchOptions: RequestInit = {
  credentials: 'include', // Include cookies for session
};
