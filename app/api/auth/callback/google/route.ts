/**
 * GET /api/auth/callback/google
 *
 * Google OAuth callback endpoint.
 *
 * Query Parameters:
 * - code: Authorization code from Google
 * - state: OAuth state parameter for CSRF protection
 * - error: Error code if OAuth failed
 * - error_description: Error description if OAuth failed
 *
 * Response: Redirects to dashboard on success, or login page on error
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/services/auth.service';

/**
 * GET handler for Google OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract client information for logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Check for OAuth errors
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      // Redirect to login page with error message
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_failed');
      loginUrl.searchParams.set('message', errorDescription || 'Google OAuth failed');

      return NextResponse.redirect(loginUrl);
    }

    // Extract authorization code and state
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_failed');
      loginUrl.searchParams.set('message', 'Missing authorization code');

      return NextResponse.redirect(loginUrl);
    }

    // Handle OAuth callback
    const result = await handleOAuthCallback(
      'google',
      code,
      state,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_failed');
      loginUrl.searchParams.set('message', result.message);

      return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard with token
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('token', result.token || '');

    return NextResponse.redirect(dashboardUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);

    // Redirect to login page with error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_failed');
    loginUrl.searchParams.set('message', 'An unexpected error occurred');

    return NextResponse.redirect(loginUrl);
  }
}
