/**
 * Better Auth Configuration for Korella CRM
 *
 * This module configures Better Auth with:
 * - PostgreSQL database adapter (Supabase)
 * - Email and password authentication
 * - OAuth providers (Google, Microsoft)
 * - Email verification
 * - JWT session management
 * - Password hashing with bcrypt
 * - Rate limiting
 * - Account security features
 *
 * Environment Variables Required:
 * - BETTER_AUTH_SECRET: Secret key for encryption (min 32 chars)
 * - BETTER_AUTH_URL: Base URL of the application
 * - SUPABASE_DATABASE_URL: PostgreSQL connection string
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - MICROSOFT_CLIENT_ID: Microsoft OAuth client ID
 * - MICROSOFT_CLIENT_SECRET: Microsoft OAuth client secret
 * - RESEND_API_KEY: Resend API key for emails
 * - RESEND_FROM_EMAIL: Sender email address
 */

import { betterAuth } from 'better-auth';
import { postgresAdapter } from 'better-auth/adapters/postgres';
import { neon } from '@neondatabase/serverless';
import { googleOAuthConfig, microsoftOAuthConfig } from '../config/oauth.config';
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
 * PostgreSQL connection string from Supabase
 */
const databaseUrl = process.env.SUPABASE_DATABASE_URL || '';

if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL environment variable is required');
}

/**
 * Neon database client for PostgreSQL
 */
const sql = neon(databaseUrl);

// =============================================================================
// Better Auth Configuration
// =============================================================================

/**
 * Core Better Auth configuration
 */
export const auth = betterAuth({
  // -------------------------------------------------------------------------
  // Database Configuration
  // -------------------------------------------------------------------------
  database: postgresAdapter(sql, {
    // Use the custom schema from Task 001
    // Better Auth will use our existing tables: users, oauth_providers, etc.
  }),

  // -------------------------------------------------------------------------
  // Base Configuration
  // -------------------------------------------------------------------------
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || 'http://localhost:3000',

  // -------------------------------------------------------------------------
  // Email & Password Authentication
  // -------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,
    // Require email verification before login
    requireEmailVerification: true,
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
    microsoft: {
      clientId: microsoftOAuthConfig.clientId,
      clientSecret: microsoftOAuthConfig.clientSecret,
      enabled: true,
    },
  },

  // -------------------------------------------------------------------------
  // Session Management
  // -------------------------------------------------------------------------
  session: {
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
  // Account Security
  // -------------------------------------------------------------------------
  account: {
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
          lockedUntil: new Date(Date.now() + securityConstants.LOCKOUT_DURATION_MINUTES * 60 * 1000),
        });
      },
    },
  },

  // -------------------------------------------------------------------------
  // Advanced Configuration
  // -------------------------------------------------------------------------
  advanced: {
    // Configure Better Auth to use our custom table names from Task 001
    // This maps Better Auth's default table names to our custom schema
    user: {
      modelName: 'users',
      fields: {
        id: 'id',
        email: 'email',
        name: 'full_name',
        emailVerified: 'email_verified',
        image: null, // We don't store profile image in users table
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      // Additional fields from our custom schema
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
    session: {
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
    },
    account: {
      modelName: 'oauth_providers',
      fields: {
        id: 'id',
        userId: 'user_id',
        accountId: 'provider_id',
        providerId: 'provider',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: null,
        scope: null,
        idToken: null,
        password: null,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      additionalFields: {
        provider_email: {
          type: 'string' as const,
          required: false,
        },
        provider_name: {
          type: 'string' as const,
          required: false,
        },
        provider_avatar_url: {
          type: 'string' as const,
          required: false,
        },
      },
    },
    verification: {
      modelName: 'email_verifications',
      fields: {
        id: 'id',
        identifier: 'email',
        value: 'token',
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      additionalFields: {
        user_id: {
          type: 'string' as const,
          required: false,
        },
        verified: {
          type: 'boolean' as const,
          required: false,
          defaultValue: false,
        },
        verified_at: {
          type: 'date' as const,
          required: false,
        },
        request_ip: {
          type: 'string' as const,
          required: false,
        },
        request_user_agent: {
          type: 'string' as const,
          required: false,
        },
      },
    },
    // ID generation - let database generate UUIDs
    database: {
      generateId: false, // PostgreSQL will generate UUIDs
    },
  },

  // -------------------------------------------------------------------------
  // Hooks
  // -------------------------------------------------------------------------
  hooks: {
    // After user creation
    after: [
      {
        matcher(context) {
          return context.path === '/sign-up/email';
        },
        handler: async (ctx) => {
          // Set trial expiration date
          const trialExpiresAt = new Date();
          trialExpiresAt.setDate(trialExpiresAt.getDate() + securityConstants.TRIAL_PERIOD_DAYS);

          // Update user with trial information
          await sql`
            UPDATE users
            SET trial_expires_at = ${trialExpiresAt},
                account_status = 'pending'
            WHERE id = ${ctx.user?.id}
          `;
        },
      },
    ],
    // After successful login
    after: [
      {
        matcher(context) {
          return context.path === '/sign-in/email';
        },
        handler: async (ctx) => {
          // Update last login information
          await sql`
            UPDATE users
            SET last_login_at = ${new Date()},
                last_login_ip = ${ctx.request?.headers.get('x-forwarded-for') || ctx.request?.headers.get('x-real-ip') || null},
                failed_login_count = 0
            WHERE id = ${ctx.user?.id}
          `;
        },
      },
    ],
    // After failed login
    after: [
      {
        matcher(context) {
          return context.path === '/sign-in/email' && ctx.context?.returned?.error;
        },
        handler: async (ctx) => {
          // Increment failed login count
          await sql`
            UPDATE users
            SET failed_login_count = failed_login_count + 1
            WHERE email = ${ctx.body?.email}
          `;
        },
      },
    ],
    // After password change
    after: [
      {
        matcher(context) {
          return context.path === '/change-password';
        },
        handler: async (ctx) => {
          // Send password change confirmation email
          if (ctx.user) {
            await sendPasswordChangedEmail({
              to: ctx.user.email,
              userName: ctx.user.name,
              changedAt: new Date(),
            });
          }
        },
      },
    ],
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
  const required = [
    'BETTER_AUTH_SECRET',
    'SUPABASE_DATABASE_URL',
  ];

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
