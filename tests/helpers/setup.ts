/**
 * Test Helper Setup Utilities
 *
 * Provides helper functions for setting up test environments,
 * creating test data, and managing test state.
 *
 * Note: Environment variables are loaded in the main tests/setup.ts file.
 * This file provides additional utilities for test helpers.
 */

import { randomInt } from 'crypto';

// =============================================================================
// Configuration
// =============================================================================

/**
 * API base URL for integration tests
 * Uses NEXT_PUBLIC_API_URL from .env.test or falls back to localhost
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Test database configuration
 */
export const TEST_DB_URL = process.env.SUPABASE_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// =============================================================================
// Test User Management
// =============================================================================

/**
 * Generate a unique test email address
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = randomInt(1000, 9999);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate test user data
 */
export function generateTestUser(overrides: Partial<{
  full_name: string;
  email: string;
  password: string;
}> = {}) {
  return {
    full_name: 'Test User',
    email: generateTestEmail(),
    password: 'TestPassword123!',
    ...overrides,
  };
}

/**
 * Create a test user via the API (for integration tests)
 */
export async function createTestUser(overrides: Partial<{
  full_name: string;
  email: string;
  password: string;
}> = {}) {
  const userData = generateTestUser(overrides);

  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create test user: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  return {
    ...userData,
    id: result.user?.id,
  };
}

/**
 * Login a test user and return the token (for integration tests)
 */
export async function loginTestUser(email: string, password: string, rememberMe = false) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      remember_me: rememberMe,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to login test user: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Delete a test user (cleanup for integration tests)
 */
export async function deleteTestUser(token: string) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok;
}

// =============================================================================
// HTTP Request Helpers
// =============================================================================

/**
 * Make an authenticated API request
 */
export async function authRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {}
) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Make an unauthenticated API request
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

// =============================================================================
// Timing Utilities
// =============================================================================

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(baseDelay * Math.pow(2, attempt - 1));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await wait(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

// =============================================================================
// Test Data Cleanup
// =============================================================================

/**
 * Track created test resources for cleanup
 */
const createdResources: Array<{ type: string; id: string; cleanup: () => Promise<void> }> = [];

/**
 * Register a resource for cleanup after tests
 */
export function trackResource(
  type: string,
  id: string,
  cleanup: () => Promise<void>
) {
  createdResources.push({ type, id, cleanup });
}

/**
 * Clean up all tracked resources
 */
export async function cleanupAllResources() {
  for (const resource of createdResources.reverse()) {
    try {
      await resource.cleanup();
    } catch (error) {
      console.warn(`Failed to cleanup ${resource.type} ${resource.id}:`, error);
    }
  }
  createdResources.length = 0;
}
