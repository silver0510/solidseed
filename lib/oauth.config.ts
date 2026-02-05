import { z } from 'zod';

/**
 * OAuth Provider Configuration
 *
 * This file defines the OAuth configuration structure for Google provider
 * used with Better Auth in the SolidSeed CRM application.
 *
 * @see https://www.better-auth.com/docs/authentication/social
 * @see docs/oauth-setup.md for setup instructions
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for a single OAuth provider
 */
export interface OAuthProviderConfig {
  /** OAuth client ID from the provider */
  clientId: string;
  /** OAuth client secret from the provider */
  clientSecret: string;
  /** Callback URL for OAuth redirect */
  redirectUri: string;
  /** OAuth scopes to request from the provider */
  scopes: readonly string[];
}

/**
 * Complete OAuth configuration for all providers
 */
export interface OAuthConfig {
  google: OAuthProviderConfig;
}

// ============================================================================
// OAuth Scopes
// ============================================================================

/**
 * Google OAuth 2.0 scopes
 * @see https://developers.google.com/identity/protocols/oauth2/scopes
 */
export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
] as const;


// ============================================================================
// Redirect URI Builders
// ============================================================================

/**
 * Build OAuth callback URL for a given provider
 * @param appUrl - Base application URL (e.g., http://localhost:3000)
 * @param provider - OAuth provider name
 * @returns Full callback URL
 */
export function buildRedirectUri(
  appUrl: string,
  provider: 'google'
): string {
  // Remove trailing slash from app URL if present
  const baseUrl = appUrl.replace(/\/$/, '');
  return `${baseUrl}/api/auth/callback/${provider}`;
}

// ============================================================================
// Environment Variable Validation
// ============================================================================

/**
 * Zod schema for OAuth environment variables
 */
export const oauthEnvSchema = z.object({
  // Google OAuth
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, 'Google Client ID is required')
    .refine(
      (val) => val.includes('.apps.googleusercontent.com') || val === 'your-google-client-id',
      'Google Client ID should end with .apps.googleusercontent.com'
    ),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, 'Google Client Secret is required'),

  // App URL for building redirect URIs
  BETTER_AUTH_URL: z
    .string()
    .url('BETTER_AUTH_URL must be a valid URL')
    .default('http://localhost:3000'),
});

export type OAuthEnv = z.infer<typeof oauthEnvSchema>;

// ============================================================================
// Configuration Builder
// ============================================================================

/**
 * Create OAuth configuration from environment variables
 * @param env - Validated environment variables
 * @returns Complete OAuth configuration
 */
export function createOAuthConfig(env: OAuthEnv): OAuthConfig {
  return {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: buildRedirectUri(env.BETTER_AUTH_URL, 'google'),
      scopes: GOOGLE_SCOPES,
    },
  };
}

// ============================================================================
// Better Auth Provider Configuration
// ============================================================================

/**
 * Get Better Auth social provider configuration
 *
 * This returns the configuration format expected by Better Auth's
 * socialProviders option.
 *
 * @example
 * ```ts
 * import { betterAuth } from 'better-auth';
 * import { getBetterAuthSocialProviders } from '@/lib/oauth.config';
 *
 * const auth = betterAuth({
 *   socialProviders: getBetterAuthSocialProviders(),
 *   // ... other options
 * });
 * ```
 */
export function getBetterAuthSocialProviders() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Validate required variables
  if (!googleClientId || !googleClientSecret) {
    throw new Error(
      'Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    );
  }

  return {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  };
}

// ============================================================================
// Constants
// ============================================================================

/**
 * OAuth provider display names
 */
export const OAUTH_PROVIDER_NAMES = {
  google: 'Google',
} as const;

/**
 * OAuth provider icons (for UI)
 */
export const OAUTH_PROVIDER_ICONS = {
  google: '/icons/google.svg',
} as const;

/**
 * Supported OAuth providers
 */
export const SUPPORTED_OAUTH_PROVIDERS = ['google'] as const;

export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a provider is supported
 */
export function isOAuthProvider(provider: string): provider is SupportedOAuthProvider {
  return SUPPORTED_OAUTH_PROVIDERS.includes(provider as SupportedOAuthProvider);
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: SupportedOAuthProvider): string {
  return OAUTH_PROVIDER_NAMES[provider];
}
