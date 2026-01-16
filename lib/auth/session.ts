/**
 * Server-side session validation for API routes
 *
 * Uses Better Auth to validate sessions and get user information.
 */

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface SessionResult {
  user: SessionUser | null;
  error: string | null;
}

/**
 * Get the authenticated user from the current request
 * Uses Better Auth to validate the session from cookies
 *
 * @returns SessionResult with user data or error
 */
export async function getSessionUser(): Promise<SessionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { user: null, error: 'Not authenticated' };
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      error: null,
    };
  } catch (error) {
    // Handle URL parsing errors from Better Auth gracefully
    // This can happen when the request headers don't include proper host information
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('parse URL') || errorMessage.includes('Invalid URL')) {
      console.warn('URL parsing error in session validation, continuing anyway:', errorMessage);
      // Return not authenticated rather than crashing
      return { user: null, error: 'Session validation failed due to URL parsing' };
    }

    console.error('Session validation error:', error);
    return { user: null, error: 'Session validation failed' };
  }
}

/**
 * Require authentication - throws if not authenticated
 * Use in API routes that require auth
 *
 * @returns SessionUser
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const { user, error } = await getSessionUser();

  if (!user) {
    throw new Error(error || 'Not authenticated');
  }

  return user;
}
