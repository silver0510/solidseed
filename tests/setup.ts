/**
 * Vitest Global Test Setup
 *
 * This file runs before all tests and sets up the test environment.
 * It loads environment variables from .env.test and configures global mocks.
 */

import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import dotenv from 'dotenv';
import path from 'path';

// =============================================================================
// Environment Setup
// =============================================================================

// Load test environment variables FIRST, before any other imports
// This must happen before modules that read env vars at initialization
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true, // Override any existing env vars
});

// Ensure critical env vars are set (fallback for CI or missing .env.test)
const ensureEnvVar = (key: string, defaultValue: string) => {
  if (!process.env[key]) {
    process.env[key] = defaultValue;
  }
};

// Database - required for module initialization
ensureEnvVar('SUPABASE_DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres');
ensureEnvVar('DATABASE_URL', process.env.SUPABASE_DATABASE_URL!);

// Authentication
ensureEnvVar('BETTER_AUTH_SECRET', 'test-secret-key-minimum-32-characters-for-testing-purposes-only');
ensureEnvVar('BETTER_AUTH_URL', 'http://localhost:3000');
ensureEnvVar('JWT_SECRET', 'test-jwt-secret-key-minimum-32-characters-for-testing');

// OAuth (fake values for mocking)
ensureEnvVar('GOOGLE_CLIENT_ID', 'test-google-client-id.apps.googleusercontent.com');
ensureEnvVar('GOOGLE_CLIENT_SECRET', 'test-google-client-secret');

// Email service
ensureEnvVar('RESEND_API_KEY', 're_test_1234567890abcdef');
ensureEnvVar('RESEND_FROM_EMAIL', 'test@localhost');

// Application URLs
ensureEnvVar('APP_URL', 'http://localhost:3000');
ensureEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000');

// =============================================================================
// Global Mocks for External Services
// =============================================================================

// Mock console.error to reduce noise in tests (optional)
// Uncomment if you want cleaner test output
// vi.spyOn(console, 'error').mockImplementation(() => {});

// =============================================================================
// Test Lifecycle Hooks
// =============================================================================

beforeAll(() => {
  // Verify environment is properly configured
  if (!process.env.SUPABASE_DATABASE_URL) {
    throw new Error('Test setup failed: SUPABASE_DATABASE_URL not set');
  }
});

// Cleanup after each test
afterEach(() => {
  // Clean up React Testing Library
  cleanup();

  // Clear all mocks
  vi.clearAllMocks();

  // Reset modules if needed for isolation
  // vi.resetModules(); // Uncomment for full module isolation between tests
});

// =============================================================================
// Custom Matchers (optional)
// =============================================================================

expect.extend({
  // Add custom matchers here if needed
  // Example:
  // toBeValidEmail(received: string) {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   const pass = emailRegex.test(received);
  //   return {
  //     message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
  //     pass,
  //   };
  // },
});

// =============================================================================
// Global Test Utilities
// =============================================================================

// Export test utilities that can be used across tests
export const testUtils = {
  /**
   * Wait for a specified amount of time
   */
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Generate a unique test email
   */
  generateTestEmail: () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,

  /**
   * Generate a valid test password
   */
  generateTestPassword: () => 'TestPassword123!',
};
