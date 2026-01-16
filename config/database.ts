/**
 * Database Configuration for Korella CRM
 *
 * This module provides database configuration and connection utilities
 * for the authentication system using Supabase PostgreSQL.
 *
 * Database ID Type:
 * - All tables use PostgreSQL native UUID type (16 bytes storage)
 * - IDs are auto-generated using gen_random_uuid()
 * - TypeScript types represent IDs as strings
 * - Benefits: 93% storage reduction vs VARCHAR(255), faster queries, type safety
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anon/public key
 * - SUPABASE_DATABASE_URL: Direct PostgreSQL connection string (for server-side)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Environment Validation
// =============================================================================

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateDatabaseEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}`
    );
  }
}

// =============================================================================
// Database Configuration
// =============================================================================

/**
 * Database configuration object
 */
export const databaseConfig = {
  // Supabase project URL
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',

  // Supabase anon/public key (safe for client-side)
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // Direct PostgreSQL connection string (server-side only)
  connectionString: process.env.SUPABASE_DATABASE_URL || '',

  // Default schema
  schema: 'public',

  // Connection pool settings
  pool: {
    // Minimum connections in pool
    min: 2,
    // Maximum connections in pool
    max: 10,
    // Idle timeout in milliseconds
    idleTimeoutMs: 30000,
    // Connection timeout in milliseconds
    connectionTimeoutMs: 5000,
  },
} as const;

// =============================================================================
// Supabase Client Configuration
// =============================================================================

/**
 * Client-side Supabase configuration options
 */
export const supabaseClientOptions = {
  auth: {
    // Persist session to localStorage
    persistSession: true,
    // Auto-refresh JWT tokens
    autoRefreshToken: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
  },
  db: {
    // Use public schema
    schema: databaseConfig.schema,
  },
  global: {
    headers: {
      'x-application-name': 'korella-crm',
    },
  },
} as const;

// =============================================================================
// Client Factory Functions
// =============================================================================

let supabaseInstance: SupabaseClient | null = null;

/**
 * Creates or returns the singleton Supabase client for client-side usage
 * Uses the anon key which is safe for browser exposure
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    validateDatabaseEnv();
    supabaseInstance = createClient(
      databaseConfig.url,
      databaseConfig.anonKey,
      supabaseClientOptions
    );
  }
  return supabaseInstance;
}

/**
 * Creates a Supabase client with a custom access token
 * Useful for server-side requests with service role key
 *
 * @param accessToken - JWT access token or service role key
 */
export function getSupabaseClientWithToken(
  accessToken: string
): SupabaseClient {
  validateDatabaseEnv();
  return createClient(databaseConfig.url, accessToken, {
    ...supabaseClientOptions,
    auth: {
      ...supabaseClientOptions.auth,
      persistSession: false,
    },
  });
}

// =============================================================================
// Database Table Names
// =============================================================================

/**
 * Authentication-related table names
 * These match the migration files and should be used consistently
 */
export const authTables = {
  users: 'users',
  oauthProviders: 'oauth_providers',
  passwordResets: 'password_resets',
  emailVerifications: 'email_verifications',
  authLogs: 'auth_logs',
} as const;

// =============================================================================
// Type Definitions for Database Schema
// =============================================================================

/**
 * User account status values
 */
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'deactivated';

/**
 * Subscription tier values
 */
export type SubscriptionTier = 'trial' | 'free' | 'pro' | 'enterprise';

/**
 * OAuth provider values
 */
export type OAuthProvider = 'google' | 'microsoft';

/**
 * Authentication event types
 */
export type AuthEventType =
  | 'login_success'
  | 'login_fail'
  | 'logout'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'password_change'
  | 'email_verification'
  | 'email_verification_resend'
  | 'account_lockout'
  | 'account_unlock'
  | 'oauth_login'
  | 'oauth_link'
  | 'oauth_unlink'
  | 'registration'
  | 'account_deactivate'
  | 'account_reactivate';

/**
 * User record type matching the users table schema
 * Note: id is PostgreSQL UUID type, represented as string in TypeScript
 */
export interface User {
  id: string; // PostgreSQL UUID (auto-generated)
  email: string;
  password_hash: string | null;
  full_name: string;
  email_verified: boolean;
  email_verified_at: string | null;
  account_status: AccountStatus;
  subscription_tier: SubscriptionTier;
  trial_expires_at: string | null;
  failed_login_count: number;
  locked_until: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * OAuth provider record type matching the oauth_providers table schema
 * Note: id and user_id are PostgreSQL UUID type, represented as strings in TypeScript
 */
export interface OAuthProviderRecord {
  id: string; // PostgreSQL UUID (auto-generated)
  user_id: string; // PostgreSQL UUID (references users.id)
  provider: OAuthProvider;
  provider_id: string;
  access_token: string | null;
  refresh_token: string | null;
  access_token_expires_at: string | null;
  provider_email: string | null;
  provider_name: string | null;
  provider_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Password reset record type matching the password_resets table schema
 * Note: id and user_id are PostgreSQL UUID type, represented as strings in TypeScript
 */
export interface PasswordReset {
  id: string; // PostgreSQL UUID (auto-generated)
  user_id: string; // PostgreSQL UUID (references users.id)
  token: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  request_ip: string | null;
  request_user_agent: string | null;
  created_at: string;
}

/**
 * Email verification record type matching the email_verifications table schema
 * Note: id and user_id are PostgreSQL UUID type, represented as strings in TypeScript
 */
export interface EmailVerification {
  id: string; // PostgreSQL UUID (auto-generated)
  user_id: string; // PostgreSQL UUID (references users.id)
  token: string;
  email: string;
  expires_at: string;
  verified: boolean;
  verified_at: string | null;
  request_ip: string | null;
  request_user_agent: string | null;
  created_at: string;
}

/**
 * Auth log record type matching the auth_logs table schema
 * Note: id and user_id are PostgreSQL UUID type, represented as strings in TypeScript
 */
export interface AuthLog {
  id: string; // PostgreSQL UUID (auto-generated)
  user_id: string | null; // PostgreSQL UUID (references users.id, nullable)
  event_type: AuthEventType;
  event_details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  target_email: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Security-related constants
 */
export const securityConstants = {
  // Maximum failed login attempts before lockout
  MAX_FAILED_LOGIN_ATTEMPTS: 5,

  // Account lockout duration in minutes
  LOCKOUT_DURATION_MINUTES: 30,

  // Password reset token expiration in hours
  PASSWORD_RESET_EXPIRATION_HOURS: 1,

  // Email verification token expiration in hours
  EMAIL_VERIFICATION_EXPIRATION_HOURS: 24,

  // Auth log retention period in days
  AUTH_LOG_RETENTION_DAYS: 7,

  // Trial period duration in days
  TRIAL_PERIOD_DAYS: 14,

  // Default JWT expiration in days
  DEFAULT_JWT_EXPIRATION_DAYS: 3,

  // Extended JWT expiration with "remember me" in days
  EXTENDED_JWT_EXPIRATION_DAYS: 30,

  // Bcrypt cost factor
  BCRYPT_COST_FACTOR: 12,
} as const;

/**
 * Rate limiting constants
 */
export const rateLimitConstants = {
  // Login attempts per minute per IP
  LOGIN_ATTEMPTS_PER_MINUTE: 10,

  // Password reset requests per hour per email
  PASSWORD_RESET_PER_HOUR: 3,
} as const;
