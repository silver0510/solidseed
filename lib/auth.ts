/**
 * Better Auth Configuration for Korella CRM
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
import { Pool } from 'pg';
import { googleOAuthConfig } from '../config/oauth.config';
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendAccountLockoutAlertEmail,
  createVerificationLink,
  createPasswordResetLink,
} from '../services/email.service';
import {
  securityConstants,
  rateLimitConstants,
} from '../config/database';

// =============================================================================
// Database Configuration
// =============================================================================

/**
 * Get database URL from environment
 * Better Auth connects directly to PostgreSQL via pg Pool
 */
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

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

  // Better Auth automatically uses gen_random_uuid() for PostgreSQL
  // No explicit generateId configuration needed - defaults to database UUID generation

  // -------------------------------------------------------------------------
  // Base Configuration
  // -------------------------------------------------------------------------
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || 'http://localhost:3000',

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
    // Temporarily disable email verification to test OAuth
    requireEmailVerification: false,
    // Send verification email on signup
    sendVerificationEmail: async ({ user, url }) => {
      const verificationLink = createVerificationLink(url.split('?token=')[1]);
      await sendEmailVerificationEmail({
        to: user.email,
        userName: user.name,
        verificationLink,
      });
    },
    // Send reset password email
    sendResetPassword: async ({ user, url }) => {
      const resetLink = createPasswordResetLink(url.split('?token=')[1]);
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetLink,
      });
    },
    // Password hashing with bcrypt (cost factor 12)
    password: {
      hash: 'bcrypt',
      bcrypt: {
        cost: securityConstants.BCRYPT_COST_FACTOR, // 12
      },
    },
    // Password complexity rules
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
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
      id: 'id',
      userId: 'user_id',
      token: 'token',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    // Don't store sessions in database - we're using JWT only
    storeSessionInDatabase: false,
    // Use JWT tokens for stateless session management
    jwt: {
      // Secret key for signing JWTs (from environment)
      secret: process.env.BETTER_AUTH_SECRET || '',
      // Default token expiration: 3 days
      expiresIn: `${securityConstants.DEFAULT_JWT_EXPIRATION_DAYS}d`,
      // Signing algorithm
      algorithm: 'HS256',
    },
    // Refresh token configuration (for "remember me")
    refreshToken: {
      // Extended expiration for "remember me": 30 days
      expiresIn: `${securityConstants.EXTENDED_JWT_EXPIRATION_DAYS}d`,
    },
    // Session cookie configuration
    cookieCache: {
      enabled: false, // We're using JWT tokens, not cookie-based sessions
    },
  },

  // -------------------------------------------------------------------------
  // Email Verification
  // -------------------------------------------------------------------------
  emailVerification: {
    enabled: true,
    // Verification token expires in 24 hours
    verificationTokenExpiresIn: securityConstants.EMAIL_VERIFICATION_EXPIRATION_HOURS * 60 * 60, // 24 hours in seconds
    // Require verification before login
    requireVerification: true,
    // Auto-send verification email on signup
    sendVerificationEmail: true,
    // Allow resending verification email
    sendOnSignUp: true,
  },

  // -------------------------------------------------------------------------
  // Rate Limiting
  // -------------------------------------------------------------------------
  rateLimit: {
    // Login rate limiting: 10 attempts per minute per IP
    login: {
      enabled: true,
      max: rateLimitConstants.LOGIN_ATTEMPTS_PER_MINUTE, // 10
      window: 60, // 60 seconds (1 minute)
    },
    // Password reset rate limiting: 3 attempts per hour per email
    passwordReset: {
      enabled: true,
      max: rateLimitConstants.PASSWORD_RESET_PER_HOUR, // 3
      window: 3600, // 3600 seconds (1 hour)
    },
  },

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
    // Account lockout after failed login attempts
    lockUserAfterFailedLogin: {
      enabled: true,
      // Max failed attempts before lockout
      max: securityConstants.MAX_FAILED_LOGIN_ATTEMPTS, // 5
      // Lockout duration in minutes
      lockoutDuration: securityConstants.LOCKOUT_DURATION_MINUTES, // 30 minutes
      // Send security email on lockout
      onLocked: async ({ user }) => {
        await sendAccountLockoutAlertEmail({
          to: user.email,
          userName: user.name,
          lockedUntil: new Date(
            Date.now() + securityConstants.LOCKOUT_DURATION_MINUTES * 60 * 1000
          ),
        });
      },
    },
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
});

// -------------------------------------------------------------------------
// Type Exports
// -------------------------------------------------------------------------

/**
 * Auth session type
 */
export type Session = typeof auth.$Infer.Session;

/**
 * User type with additional fields
 */
export type User = typeof auth.$Infer.User;

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
