/**
 * Better Auth Middleware for Next.js
 *
 * This middleware integrates Better Auth with Next.js for:
 * - Route protection
 * - Session validation
 * - JWT token verification
 * - Subscription tier checking
 * - Rate limiting
 *
 * Usage in Next.js App Router:
 * - Import and use in route handlers
 * - Protects API routes and pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../lib/auth';
import type { Session } from '../lib/auth';

// =============================================================================
// Middleware Configuration
// =============================================================================

/**
 * Protected route paths that require authentication
 */
const protectedPaths = [
  '/dashboard',
  '/api/protected',
  '/api/clients',
  '/api/settings',
];

/**
 * Public paths that don't require authentication
 */
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
];

/**
 * Paths that require specific subscription tiers
 */
const tierProtectedPaths: Record<string, string[]> = {
  pro: ['/api/clients/export', '/api/clients/advanced'],
  enterprise: ['/api/admin', '/api/team'],
};

// =============================================================================
// Session Validation
// =============================================================================

/**
 * Extracts and validates JWT token from request
 */
export async function getSessionFromRequest(request: NextRequest): Promise<Session | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // Validate session using Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return session as Session | null;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Checks if user has required subscription tier
 */
export function hasRequiredTier(
  userTier: string,
  requiredTier: string
): boolean {
  const tierHierarchy = ['trial', 'free', 'pro', 'enterprise'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  return userTierIndex >= requiredTierIndex;
}

// =============================================================================
// Middleware Functions
// =============================================================================

/**
 * Better Auth middleware for Next.js
 *
 * Protects routes by validating JWT tokens and checking subscription tiers
 */
export async function betterAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const session = await getSessionFromRequest(request);

    if (!session) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user's subscription tier allows access
    const userTier = session.user.subscription_tier || 'free';

    for (const [tier, paths] of Object.entries(tierProtectedPaths)) {
      if (paths.some((path) => pathname.startsWith(path))) {
        if (!hasRequiredTier(userTier, tier)) {
          // Redirect to upgrade page if tier insufficient
          return NextResponse.redirect(new URL('/upgrade', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

/**
 * Route guard helper for API routes
 *
 * Usage in route handlers:
 * ```ts
 * import { withAuth } from '@/middleware/auth.middleware';
 *
 * export const GET = withAuth(async (req, session) => {
 *   // Your handler logic here
 *   return Response.json({ data: 'protected' });
 * });
 * ```
 */
export function withAuth<T extends Response = Response>(
  handler: (request: NextRequest, session: Session) => Promise<T> | T,
  options?: {
    requiredTier?: 'trial' | 'free' | 'pro' | 'enterprise';
  }
) {
  return async (request: NextRequest): Promise<T> => {
    // Validate session
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing token' },
        { status: 401 }
      ) as T;
    }

    // Check subscription tier if required
    if (options?.requiredTier) {
      const userTier = session.user.subscription_tier || 'free';

      if (!hasRequiredTier(userTier, options.requiredTier)) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: `This feature requires ${options.requiredTier} tier or higher`,
          },
          { status: 403 }
        ) as T;
      }
    }

    // Call the actual handler
    return handler(request, session);
  };
}

/**
 * Optional auth helper - attaches session if available, doesn't error if not
 *
 * Usage:
 * ```ts
 * import { withOptionalAuth } from '@/middleware/auth.middleware';
 *
 * export const GET = withOptionalAuth(async (req, session) => {
 *   if (session) {
 *     // User is authenticated
 *   } else {
 *     // User is not authenticated
 *   }
 * });
 * ```
 */
export function withOptionalAuth<T extends Response = Response>(
  handler: (request: NextRequest, session: Session | null) => Promise<T> | T
) {
  return async (request: NextRequest): Promise<T> => {
    const session = await getSessionFromRequest(request);
    return handler(request, session);
  };
}

// =============================================================================
// Error Responses
// =============================================================================

/**
 * Standard error responses for auth failures
 */
export const authErrors = {
  unauthorized: {
    error: 'Unauthorized',
    message: 'Authentication required',
    status: 401,
  },
  invalidToken: {
    error: 'Unauthorized',
    message: 'Invalid or expired token',
    status: 401,
  },
  forbidden: {
    error: 'Forbidden',
    message: 'Insufficient permissions',
    status: 403,
  },
  insufficientTier: {
    error: 'Forbidden',
    message: 'This feature requires a higher subscription tier',
    status: 403,
  },
  accountLocked: {
    error: 'Locked',
    message: 'Account has been locked due to multiple failed login attempts',
    status: 423,
  },
  emailNotVerified: {
    error: 'Forbidden',
    message: 'Email address must be verified before accessing this feature',
    status: 403,
  },
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Creates an authentication error response
 */
export function createAuthResponse(
  error: keyof typeof authErrors,
  customMessage?: string
): NextResponse {
  const errorConfig = authErrors[error];
  return NextResponse.json(
    {
      error: errorConfig.error,
      message: customMessage || errorConfig.message,
    },
    { status: errorConfig.status }
  );
}

/**
 * Checks if session is valid and not expired
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) {
    return false;
  }

  // Check if session is expired
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return false;
  }

  // Check if user's account is locked
  if (session.user.locked_until && new Date(session.user.locked_until) > new Date()) {
    return false;
  }

  // Check if user's account is deactivated
  if (session.user.account_status === 'deactivated' || session.user.is_deleted) {
    return false;
  }

  return true;
}

/**
 * Gets user from session with validation
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  user: Session['user'] | null;
  session: Session | null;
  error?: string;
}> {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return {
        user: null,
        session: null,
        error: 'No valid session found',
      };
    }

    if (!isSessionValid(session)) {
      return {
        user: null,
        session: null,
        error: 'Session is invalid or expired',
      };
    }

    return {
      user: session.user,
      session,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// TypeScript Exports
// =============================================================================

export type { Session };
