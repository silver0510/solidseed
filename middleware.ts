import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log all requests to dashboard routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/clients') || pathname.startsWith('/deals')) {
    console.log(`[Middleware] Request to: ${pathname}`);
    console.log(`[Middleware] Cookies:`, request.cookies.getAll().map(c => c.name));

    // Check for session cookie
    const sessionCookie = request.cookies.get('__Secure-better-auth.session_token')
      || request.cookies.get('better-auth.session_token');

    console.log(`[Middleware] Session cookie present:`, !!sessionCookie);
  }

  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clients/:path*',
    '/deals/:path*',
    '/tasks/:path*',
    '/settings/:path*',
  ],
};
