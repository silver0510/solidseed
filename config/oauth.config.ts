/**
 * OAuth Provider Configuration for Korella CRM
 *
 * This module provides OAuth configuration for Google and Microsoft
 * social login providers.
 *
 * Environment Variables Required:
 * - GOOGLE_CLIENT_ID: Google OAuth 2.0 Client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth 2.0 Client Secret
 * - MICROSOFT_CLIENT_ID: Microsoft Azure AD Application ID
 * - MICROSOFT_CLIENT_SECRET: Microsoft Azure AD Client Secret
 * - APP_URL: Base URL of the application (for OAuth callbacks)
 */

// =============================================================================
// Environment Validation
// =============================================================================

/**
 * Validates that all required OAuth environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateOAuthConfig(): void {
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required OAuth environment variables: ${missing.join(', ')}`
    );
  }
}

// =============================================================================
// OAuth Configuration
// =============================================================================

/**
 * Application base URL for OAuth callbacks
 */
export const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Google OAuth configuration
 */
export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: `${appUrl}/api/auth/callback/google`,
  scopes: ['email', 'profile'],
  // Map Google profile fields to user fields
  mapProfileToUser: (profile: Record<string, unknown>) => ({
    name: profile.name as string,
    email: profile.email as string,
    image: profile.picture as string | null,
    emailVerified: profile.verified_email as boolean || true, // Google emails are pre-verified
  }),
} as const;

/**
 * Microsoft OAuth configuration
 */
export const microsoftOAuthConfig = {
  clientId: process.env.MICROSOFT_CLIENT_ID || '',
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  redirectUri: `${appUrl}/api/auth/callback/microsoft`,
  scopes: ['email', 'profile'],
  // Map Microsoft profile fields to user fields
  mapProfileToUser: (profile: Record<string, unknown>) => ({
    name: profile.displayName as string,
    email: profile.mail || profile.userPrincipalName as string,
    image: null, // Microsoft doesn't always provide profile photo in basic profile
    emailVerified: true, // Microsoft emails are pre-verified
  }),
} as const;

/**
 * Combined OAuth providers configuration
 */
export const oauthProviders = {
  google: googleOAuthConfig,
  microsoft: microsoftOAuthConfig,
} as const;

/**
 * OAuth provider type
 */
export type OAuthProvider = keyof typeof oauthProviders;

/**
 * Validates OAuth provider exists
 */
export function isValidOAuthProvider(provider: string): provider is OAuthProvider {
  return provider in oauthProviders;
}

/**
 * Gets OAuth configuration for a specific provider
 */
export function getOAuthProviderConfig(provider: OAuthProvider) {
  return oauthProviders[provider];
}

// =============================================================================
// OAuth Scopes
// =============================================================================

/**
 * Standard OAuth scopes for both providers
 */
export const oauthScopes = {
  // Basic profile information
  profile: 'profile',
  // Email address
  email: 'email',
  // Offline access (for refresh tokens)
  offlineAccess: 'offline_access',
  // OpenID Connect
  openid: 'openid',
} as const;

// =============================================================================
// OAuth Error Messages
// =============================================================================

/**
 * Standard error messages for OAuth failures
 */
export const oauthErrorMessages = {
  // Provider-specific errors
  google: {
    accessDenied: 'You denied access to your Google account. Please try again.',
    authenticationFailed: 'Google authentication failed. Please try again.',
    invalidCredentials: 'Invalid Google OAuth credentials.',
  },
  microsoft: {
    accessDenied: 'You denied access to your Microsoft account. Please try again.',
    authenticationFailed: 'Microsoft authentication failed. Please try again.',
    invalidCredentials: 'Invalid Microsoft OAuth credentials.',
  },
  // General errors
  general: {
    invalidProvider: 'Invalid OAuth provider.',
    codeExpired: 'OAuth authorization code has expired. Please try again.',
    stateMismatch: 'OAuth state mismatch. Possible CSRF attack.',
    unknownError: 'An unknown error occurred during OAuth authentication.',
  },
} as const;
