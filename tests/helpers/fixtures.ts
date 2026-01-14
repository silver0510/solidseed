/**
 * Test Fixtures
 *
 * Provides constant UUID values for use in tests.
 * These UUIDs are stable across test runs to ensure consistent test behavior.
 *
 * Database ID Type:
 * - All database tables use PostgreSQL native UUID type (not VARCHAR)
 * - Test fixtures use valid UUID v4 format to match database constraints
 * - IDs are represented as strings in TypeScript
 * - Format: 8-4-4-4-12 hex digits (e.g., 123e4567-e89b-12d3-a456-426614174000)
 */

/**
 * Fixed UUID constants for testing
 * Using valid UUID v4 format matching PostgreSQL UUID type
 */
export const TEST_IDS = {
  // User IDs
  USER_1: '123e4567-e89b-12d3-a456-426614174000',
  USER_2: '223e4567-e89b-12d3-a456-426614174001',
  USER_3: '323e4567-e89b-12d3-a456-426614174002',

  // Session IDs
  SESSION_1: '423e4567-e89b-12d3-a456-426614174003',
  SESSION_2: '523e4567-e89b-12d3-a456-426614174004',

  // Auth log IDs
  LOG_1: '623e4567-e89b-12d3-a456-426614174005',
  LOG_2: '723e4567-e89b-12d3-a456-426614174006',

  // OAuth provider IDs
  OAUTH_GOOGLE: '823e4567-e89b-12d3-a456-426614174007',
  OAUTH_MICROSOFT: '923e4567-e89b-12d3-a456-426614174008',

  // Client IDs (for Client Hub)
  CLIENT_1: 'a23e4567-e89b-12d3-a456-426614174009',
  CLIENT_2: 'b23e4567-e89b-12d3-a456-42661417400a',
  CLIENT_3: 'c23e4567-e89b-12d3-a456-42661417400b',

  // Client tag IDs
  TAG_1: 'd23e4567-e89b-12d3-a456-42661417400c',
  TAG_2: 'e23e4567-e89b-12d3-a456-42661417400d',

  // Client document IDs
  DOCUMENT_1: 'f23e4567-e89b-12d3-a456-42661417400e',
  DOCUMENT_2: '023e4567-e89b-12d3-a456-42661417400f',

  // Client note IDs
  NOTE_1: '123e4567-e89b-12d3-a456-426614174010',
  NOTE_2: '223e4567-e89b-12d3-a456-426614174011',

  // Client task IDs
  TASK_1: '323e4567-e89b-12d3-a456-426614174012',
  TASK_2: '423e4567-e89b-12d3-a456-426614174013',

  // Verification token IDs
  VERIFICATION_1: '523e4567-e89b-12d3-a456-426614174014',

  // Password reset IDs
  RESET_1: '623e4567-e89b-12d3-a456-426614174015',
  RESET_2: '723e4567-e89b-12d3-a456-426614174016',

  // Email verification IDs
  EMAIL_VERIFY_1: '823e4567-e89b-12d3-a456-426614174017',
  EMAIL_VERIFY_2: '923e4567-e89b-12d3-a456-426614174018',
} as const;

/**
 * Helper to generate a random UUID for dynamic test scenarios
 * Use this when you need a unique UUID per test run
 *
 * Note: Generates UUID v4 format matching PostgreSQL gen_random_uuid()
 * The database uses gen_random_uuid() for actual UUID generation
 */
export function generateTestUUID(): string {
  // Use Node.js crypto.randomUUID() for valid UUID v4
  return require('crypto').randomUUID();
}

/**
 * Type for test IDs
 */
export type TestId = keyof typeof TEST_IDS;
