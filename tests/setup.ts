import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup environment variables for tests
process.env.SUPABASE_DATABASE_URL = 'postgresql://postgres:test@localhost:5432/test';
process.env.BETTER_AUTH_SECRET = 'test-secret-minimum-32-characters-long-for-testing';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Custom matchers (if needed)
expect.extend({
  // Add custom matchers here
});
