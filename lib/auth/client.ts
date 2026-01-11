/**
 * Better Auth Client Configuration
 *
 * This module creates a Better Auth client instance for frontend use.
 * The client provides methods for authentication actions like sign in, sign up, and OAuth.
 */

import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client instance
 * Used for all client-side authentication operations
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
});
