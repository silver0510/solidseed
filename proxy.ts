import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/clients',
  '/tasks',
  '/deals',
  '/settings',
];

// Auth routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/reset-password',
  '/verify-email',
  '/onboarding',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  // Allow API routes and static files to pass through
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // For protected routes, check authentication and onboarding
  if (isProtectedRoute) {
    // Get token from cookies
    // In production, Better Auth uses __Secure- prefix for cookies
    const token = request.cookies.get('__Secure-better-auth.session_token')?.value ||
                  request.cookies.get('better-auth.session_token')?.value ||
                  request.cookies.get('session_token')?.value;

    // If no token at all, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Check onboarding status (only for authenticated users)
    // Skip onboarding check if already on onboarding page
    if (!pathname.startsWith('/onboarding')) {
      try {
        const preferencesUrl = new URL('/api/user-preferences', request.url);
        const response = await fetch(preferencesUrl.toString(), {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && !data.data.onboarding_completed) {
            // Redirect to onboarding if not completed
            return NextResponse.redirect(new URL('/onboarding/deal-types', request.url));
          }
        }
      } catch (error) {
        // On error, allow request to continue
        // API routes will handle auth validation
        console.error('Error checking onboarding status:', error);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
