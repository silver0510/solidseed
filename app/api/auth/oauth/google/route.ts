/**
 * GET /api/auth/oauth/google
 *
 * Initiates Google OAuth flow by redirecting user to Google's consent screen.
 *
 * Query Parameters:
 * - redirect_uri: Optional override for the redirect URI after successful auth
 *
 * Response: Redirects to Google OAuth consent screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * GET handler for initiating Google OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    // Generate OAuth authorization URL using Better Auth
    const baseURL = process.env.BETTER_AUTH_URL || process.env.APP_URL || 'http://localhost:3000';

    // Better Auth will generate the OAuth URL
    const url = await auth.api.getOAuthURI({
      provider: 'google',
      redirectURI: `${baseURL}/api/auth/callback/google`,
    });

    // Redirect user to Google OAuth consent screen
    return NextResponse.redirect(url);

  } catch (error) {
    console.error('Google OAuth initiation error:', error);

    // Redirect to login page with error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_failed');
    loginUrl.searchParams.set('message', 'Failed to initiate Google OAuth');

    return NextResponse.redirect(loginUrl);
  }
}
