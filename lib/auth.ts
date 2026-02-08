/**
 * Better Auth Configuration for SolidSeed CRM
 *
 * Simplified architecture using direct PostgreSQL connection:
 * - PostgreSQL connection via pg Pool (no Prisma)
 * - Email and password authentication
 * - OAuth provider (Google)
 * - Email verification
 * - JWT session management
 * - Password hashing with bcrypt
 * - Rate limiting
 * - Account security features
 *
 * Database ID Type:
 * - All tables use PostgreSQL native UUID type (not VARCHAR)
 * - IDs are auto-generated using gen_random_uuid()
 * - Better Auth handles UUID generation automatically with PostgreSQL
 * - Application code treats IDs as strings (TypeScript: string type)
 *
 * Environment Variables Required:
 * - BETTER_AUTH_SECRET: Secret key for encryption (min 32 chars)
 * - BETTER_AUTH_URL: Base URL of the application
 * - SUPABASE_DATABASE_URL: PostgreSQL connection string
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - RESEND_API_KEY: Resend API key for emails
 * - RESEND_FROM_EMAIL: Sender email address
 */

import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { Pool } from 'pg';
import { googleOAuthConfig } from '../config/oauth.config';
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  createVerificationLink,
  createPasswordResetLink,
} from '../services/email.service';
import {
  securityConstants,
} from '../config/database';

// =============================================================================
// Database Configuration
// =============================================================================

/**
 * Get database URL from environment
 * Better Auth connects directly to PostgreSQL via pg Pool
 */
const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required');
}

/**
 * PostgreSQL connection pool for Better Auth
 * Connects directly to Supabase PostgreSQL database
 * Better Auth uses this Pool for all database operations
 */
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

// =============================================================================
// Better Auth Configuration
// =============================================================================

/**
 * Core Better Auth configuration with direct PostgreSQL connection
 * No Prisma adapter needed - Better Auth uses the Pool directly
 */
export const auth = betterAuth({
  // -------------------------------------------------------------------------
  // Database Configuration - Direct PostgreSQL Connection
  // -------------------------------------------------------------------------
  database: pool,

  // -------------------------------------------------------------------------
  // Advanced Configuration - PostgreSQL Native UUID Generation
  // -------------------------------------------------------------------------
  advanced: {
    database: {
      // Disable Better Auth's ID generation to use PostgreSQL's gen_random_uuid()
      // Our database schema uses: id UUID PRIMARY KEY DEFAULT gen_random_uuid()
      generateId: false,
    },
    // Cookie configuration for production
    cookiePrefix: 'better-auth',
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === 'production',
  },

  // -------------------------------------------------------------------------
  // Base Configuration
  // -------------------------------------------------------------------------
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),

  // -------------------------------------------------------------------------
  // Trusted Origins - Required for OAuth redirects to work properly
  // -------------------------------------------------------------------------
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    // Production domains
    'https://www.solidseed.app',
    'https://solidseed.app',
    // Development
    'http://localhost:3000',
  ].filter((origin): origin is string => origin !== null && origin !== undefined),

  // -------------------------------------------------------------------------
  // User Model Configuration (Custom Fields Mapping)
  // -------------------------------------------------------------------------
  user: {
    modelName: 'users',
    fields: {
      email: 'email',
      name: 'full_name',
      emailVerified: 'email_verified',
      image: 'image',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    additionalFields: {
      password_hash: {
        type: 'string',
        required: false,
      },
      account_status: {
        type: 'string' as const,
        required: false,
        defaultValue: 'pending',
      },
      subscription_tier: {
        type: 'string' as const,
        required: false,
        defaultValue: 'trial',
      },
      trial_expires_at: {
        type: 'date' as const,
        required: false,
      },
      failed_login_count: {
        type: 'number' as const,
        required: false,
        defaultValue: 0,
      },
      locked_until: {
        type: 'date' as const,
        required: false,
      },
      last_login_at: {
        type: 'date' as const,
        required: false,
      },
      last_login_ip: {
        type: 'string' as const,
        required: false,
      },
      is_deleted: {
        type: 'boolean' as const,
        required: false,
        defaultValue: false,
      },
    },
  },

  // -------------------------------------------------------------------------
  // Email & Password Authentication
  // -------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,
    // Require email verification before allowing login
    requireEmailVerification: false, // Set to true after email service is tested
    // Send password reset emails
    sendResetPassword: async ({ user, url }) => {
      const token = url.split('?token=')[1] || url.split('/').pop() || '';
      const resetLink = createPasswordResetLink(token);
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetLink,
      });
    },
  },

  // -------------------------------------------------------------------------
  // OAuth Social Providers
  // -------------------------------------------------------------------------
  socialProviders: {
    google: {
      clientId: googleOAuthConfig.clientId,
      clientSecret: googleOAuthConfig.clientSecret,
      enabled: true,
    },
  },

  // -------------------------------------------------------------------------
  // Session Management
  // -------------------------------------------------------------------------
  session: {
    // Map Better Auth's default 'session' model to our 'sessions' table
    modelName: 'sessions',
    fields: {
      userId: 'user_id',
      token: 'token',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    // Session expiration configuration
    expiresIn: 60 * 60 * 24 * securityConstants.DEFAULT_JWT_EXPIRATION_DAYS, // 3 days in seconds
    // Cookie configuration for production
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },

  // -------------------------------------------------------------------------
  // Email Verification
  // -------------------------------------------------------------------------
  emailVerification: {
    // Send verification email with link
    sendVerificationEmail: async ({ user, url, token }) => {
      const verificationToken = token || url.split('?token=')[1] || url.split('/').pop() || '';
      const verificationLink = createVerificationLink(verificationToken);
      await sendEmailVerificationEmail({
        to: user.email,
        userName: user.name,
        verificationLink,
      });
    },
    // Send verification email automatically on signup
    sendOnSignUp: true,
    // Auto sign in user after they verify their email
    autoSignInAfterVerification: true,
    // Verification token expires in 24 hours
    expiresIn: securityConstants.EMAIL_VERIFICATION_EXPIRATION_HOURS * 60 * 60, // 24 hours in seconds
  },

  // -------------------------------------------------------------------------
  // Rate Limiting
  // -------------------------------------------------------------------------
  // Note: Rate limiting will be configured using Better Auth plugins
  // or middleware in a future update

  // -------------------------------------------------------------------------
  // Account Security (OAuth Provider Mapping + User Lockout)
  // -------------------------------------------------------------------------
  account: {
    // Map Better Auth's default 'account' model to our 'oauth_providers' table
    modelName: 'oauth_providers',
    fields: {
      id: 'id',
      userId: 'user_id',
      providerId: 'provider',
      accountId: 'provider_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      idToken: 'id_token',
      scope: 'scope',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    // Note: Account lockout will be configured using Better Auth plugins
    // or custom middleware in a future update
  },

  // -------------------------------------------------------------------------
  // Verification Table Configuration (for OAuth state management)
  // -------------------------------------------------------------------------
  verification: {
    modelName: 'verification',
    fields: {
      identifier: 'identifier',
      value: 'value',
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  // -------------------------------------------------------------------------
  // Plugins Configuration
  // -------------------------------------------------------------------------
  plugins: [
    // Next.js cookies plugin - must be last in plugins array
    // Automatically sets cookies for server actions
    nextCookies(),
  ],
});

// -------------------------------------------------------------------------
// Type Exports
// -------------------------------------------------------------------------

/**
 * Auth session type
 * Note: Type inference will be updated when Better Auth types are stable
 */
export type Session = any;

/**
 * User type with additional fields
 * Note: Type inference will be updated when Better Auth types are stable
 */
export type User = any;

// -------------------------------------------------------------------------
// Environment Validation
// -------------------------------------------------------------------------

/**
 * Validates that all required Better Auth environment variables are set
 */
export function validateBetterAuthEnv(): void {
  const required = ['BETTER_AUTH_SECRET', 'SUPABASE_DATABASE_URL'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Better Auth environment variables: ${missing.join(', ')}`
    );
  }

  // Validate secret key length
  const secret = process.env.BETTER_AUTH_SECRET || '';
  if (secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters long');
  }
}
