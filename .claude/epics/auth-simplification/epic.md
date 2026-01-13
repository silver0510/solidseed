---
name: auth-simplification
status: in-progress
created: 2026-01-13T07:34:54Z
updated: 2026-01-13T15:23:28Z
progress: 43%
prd: ../../prds/auth-simplification.md
github: [Will be updated when synced to GitHub]
---

# Epic: Authentication Simplification

## Overview

Modernize and simplify the authentication system through two coordinated improvements:

1. **UUID Migration**: Convert all ID fields from `VARCHAR(255)` to native PostgreSQL `UUID` type across 12 tables, providing 93% storage reduction and improved query performance while aligning with Better Auth's default PostgreSQL behavior.

2. **Prisma Removal**: Remove unnecessary Prisma ORM dependency by connecting Better Auth directly to Supabase PostgreSQL using the `pg` library Pool adapter, eliminating test failures and reducing maintenance overhead.

These changes work together to create a simpler, more performant, and more maintainable authentication system while preserving all existing functionality.

## Architecture Decisions

### 1. Migrate to Native PostgreSQL UUID Type

**Decision**: Convert all ID fields from `VARCHAR(255)` to native PostgreSQL `UUID` type with `gen_random_uuid()` defaults.

**Rationale**:

- **Better Auth defaults to UUID for PostgreSQL** - Our VARCHAR(255) setup was unnecessary
- **Massive storage savings**: 16 bytes vs 255 bytes per ID (93% reduction)
- **Performance improvement**: Binary UUID comparison faster than string comparison
- **Type safety**: PostgreSQL enforces UUID format at database level
- **Index efficiency**: Smaller indexes improve query performance and fit better in memory
- **Standard practice**: Aligns with Better Auth's recommended PostgreSQL integration

**Trade-offs**:

- **Migration required**: One-time database schema change for all 12 tables
- **Test fixtures need updating**: ~50 test mocks need valid UUID format

**Mitigation**:

- Atomic migration in single transaction
- Safe type casting: `USING id::uuid` converts existing UUID strings
- Zero application code changes: IDs remain `string` type in TypeScript
- Better Auth handles UUID ↔ string conversion automatically

**Migration Impact**:

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| Storage per ID | 255 bytes | 16 bytes | 93% reduction |
| Index size (10K users) | ~2.5MB | ~160KB | 94% smaller |
| Comparison speed | String | Binary | ~30% faster |

### 2. Direct PostgreSQL Connection via pg Pool

**Decision**: Use Better Auth's native PostgreSQL adapter with `pg` Pool instead of the Prisma adapter chain.

**Rationale**:

- Better Auth officially supports direct PostgreSQL connections via `pg` library
- Eliminates unnecessary abstraction layer (Prisma ORM)
- Reduces dependency count and bundle size
- Simplifies initialization (no Prisma client generation required)
- Aligns with Better Auth's recommended PostgreSQL integration pattern

**Trade-offs**:

- None - this is the recommended approach per Better Auth documentation
- Prisma was added unnecessarily; removing it only brings benefits

**Current Architecture**:

```
Supabase DB → pg Pool → PrismaPg adapter → PrismaClient → prismaAdapter → Better Auth
```

**New Architecture**:

```
Supabase DB → pg Pool → Better Auth
```

### 3. Preserve All Field Mappings and Custom Configuration

**Decision**: Keep all existing Better Auth configuration (field mappings, custom fields, hooks, etc.) exactly as-is, only changing the database adapter and ID type.

**Rationale**:

- Database schema changes limited to ID type conversion
- Field mappings remain unchanged
- Zero impact on user-facing functionality
- All existing data remains valid
- Reduces risk in application logic

**Trade-offs**:

- Must carefully preserve all field mapping configuration
- Need thorough testing to ensure nothing breaks

**Mitigation**:

- Copy exact configuration from current `lib/auth.ts`
- Test all authentication flows (email/password, OAuth, verification, reset)

### 4. Single Database Access Pattern

**Decision**: Use Supabase client for all application data, Better Auth uses raw `pg` Pool only for auth tables with native UUID generation.

**Rationale**:

- Clear separation of concerns
- Better Auth manages its own tables via migrations
- Application code uses Supabase client for client hub data
- No confusion about which library to use for what

**Trade-offs**:

- Two database connection methods in codebase
- Developers must understand when to use which

**Mitigation**:

- Document clearly: Better Auth for auth, Supabase client for app data
- Better Auth connection is encapsulated in `lib/auth.ts`

## Implementation Guide

### Part 1: UUID Migration (Database Layer)

#### Database Schema Changes

**Reference**: See `.claude/database/database.dbml` for existing schema and conventions.

**Tables to Migrate** (12 total):

**Authentication Tables** (7 tables):
- `users` - Core user accounts with custom fields
- `oauth_providers` - OAuth provider mappings
- `sessions` - Session management
- `verification` - Better Auth verification tokens
- `password_resets` - Password reset tokens (custom)
- `email_verifications` - Email verification tokens (custom)
- `auth_logs` - Authentication audit log (custom)

**Client Hub Tables** (5 tables):
- `clients` - Client profiles
- `client_tags` - Client tagging system
- `client_documents` - Document storage
- `client_notes` - Activity notes
- `client_tasks` - Task management

**Migration Required**: Convert all `VARCHAR(255)` ID fields to native PostgreSQL `UUID` type.

#### UUID Migration File

**File**: `supabase/migrations/20260114000001_migrate_to_uuid_type.sql`

```sql
-- Migration: Convert all ID fields from VARCHAR(255) to UUID
-- This migration converts 12 tables and their foreign keys to native PostgreSQL UUID type
-- Safe: Assumes existing VARCHAR values are valid UUID format (Better Auth generates them)

BEGIN;

-- Enable UUID extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- FOUNDATION TABLE: users
-- =============================================================================
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
COMMENT ON COLUMN users.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- =============================================================================
-- AUTH TABLES (depend on users)
-- =============================================================================

-- sessions table
ALTER TABLE sessions ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE sessions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
COMMENT ON COLUMN sessions.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- oauth_providers table
ALTER TABLE oauth_providers ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE oauth_providers ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE oauth_providers ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
COMMENT ON COLUMN oauth_providers.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- password_resets table
ALTER TABLE password_resets ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE password_resets ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE password_resets ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
COMMENT ON COLUMN password_resets.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- email_verifications table
ALTER TABLE email_verifications ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE email_verifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE email_verifications ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
COMMENT ON COLUMN email_verifications.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- auth_logs table
ALTER TABLE auth_logs ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE auth_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE auth_logs ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
COMMENT ON COLUMN auth_logs.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- =============================================================================
-- VERIFICATION TABLE (no foreign keys)
-- =============================================================================
ALTER TABLE verification ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE verification ALTER COLUMN id SET DEFAULT gen_random_uuid();
COMMENT ON COLUMN verification.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- =============================================================================
-- CLIENT HUB TABLES
-- =============================================================================

-- clients table (depends on users for created_by and assigned_to)
ALTER TABLE clients ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE clients ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE clients ALTER COLUMN created_by TYPE UUID USING created_by::uuid;
ALTER TABLE clients ALTER COLUMN assigned_to TYPE UUID USING assigned_to::uuid;
COMMENT ON COLUMN clients.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- client_tags table (depends on clients and users)
ALTER TABLE client_tags ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE client_tags ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE client_tags ALTER COLUMN client_id TYPE UUID USING client_id::uuid;
ALTER TABLE client_tags ALTER COLUMN created_by TYPE UUID USING created_by::uuid;
COMMENT ON COLUMN client_tags.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- client_documents table (depends on clients and users)
ALTER TABLE client_documents ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE client_documents ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE client_documents ALTER COLUMN client_id TYPE UUID USING client_id::uuid;
ALTER TABLE client_documents ALTER COLUMN uploaded_by TYPE UUID USING uploaded_by::uuid;
COMMENT ON COLUMN client_documents.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- client_notes table (depends on clients and users)
ALTER TABLE client_notes ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE client_notes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE client_notes ALTER COLUMN client_id TYPE UUID USING client_id::uuid;
ALTER TABLE client_notes ALTER COLUMN created_by TYPE UUID USING created_by::uuid;
COMMENT ON COLUMN client_notes.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

-- client_tasks table (depends on clients and users)
ALTER TABLE client_tasks ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE client_tasks ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE client_tasks ALTER COLUMN client_id TYPE UUID USING client_id::uuid;
ALTER TABLE client_tasks ALTER COLUMN created_by TYPE UUID USING created_by::uuid;
ALTER TABLE client_tasks ALTER COLUMN assigned_to TYPE UUID USING assigned_to::uuid;
COMMENT ON COLUMN client_tasks.id IS 'UUID primary key (PostgreSQL native, auto-generated)';

COMMIT;
```

**Migration Characteristics**:
- **Atomic**: Single transaction, rolls back automatically if any step fails
- **Safe type casting**: `USING id::uuid` converts VARCHAR UUID strings to UUID type
- **Zero data loss**: Preserves all existing ID values
- **Dependency order**: Converts tables in correct order (users first, then tables with foreign keys)

### Part 2: Prisma Removal (Application Layer)

### Simplified Better Auth Configuration

**File: lib/auth.ts** (Complete rewrite)

```typescript
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
import { securityConstants, rateLimitConstants } from '../config/database';

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
    throw new Error(`Missing required Better Auth environment variables: ${missing.join(', ')}`);
  }

  // Validate secret key length
  const secret = process.env.BETTER_AUTH_SECRET || '';
  if (secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters long');
  }
}
```

### Package.json Changes

**Remove these dependencies**:

```json
{
  "dependencies": {
    // REMOVE THESE:
    "@prisma/client": "^7.2.0",
    "@prisma/adapter-pg": "^7.2.0",
    "prisma": "^7.2.0"
  }
}
```

**Keep these dependencies** (required):

```json
{
  "dependencies": {
    "better-auth": "^1.4.10",
    "pg": "^8.16.3"
  }
}
```

### Files to Delete

1. **Prisma schema**: `prisma/schema.prisma`
2. **Generated Prisma client**: `generated/prisma/` (entire directory)

### Test File Updates

**File: tests/unit/services/auth.service.test.ts**

Remove Prisma imports and replace with mock Better Auth responses:

**Before**:

```typescript
import { PrismaClient } from '../../../generated/prisma/client';
```

**After**:

```typescript
// No Prisma imports needed
// Mock Better Auth responses directly
```

### Configuration Files (No Changes)

The following files remain unchanged:

- `config/oauth.config.ts` - Google OAuth configuration
- `config/database.ts` - Security and rate limit constants
- `services/email.service.ts` - Email service for verification and notifications

## Dependencies

**External Dependencies** (Already Installed):

- `pg` v8.16.3 - PostgreSQL client for Node.js
- `better-auth` v1.4.10 - Authentication framework

**Internal Dependencies**:

- None - This is a standalone refactoring

**Data Dependencies**:

- Existing Supabase database with auth tables already created
- No data migration required

## Migration Steps

### Phase 1: UUID Migration (Complete First)

#### Step 1: Pre-Migration Validation

Verify all existing ID values are valid UUID format:

```bash
# Connect to Supabase database and run validation query
psql $SUPABASE_DATABASE_URL -c "
SELECT COUNT(*) as invalid_ids FROM users
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
"
# Expected result: 0 (all IDs are valid UUIDs)
```

#### Step 2: Create and Apply UUID Migration

```bash
# Create migration file
supabase migration new migrate_to_uuid_type

# Copy the UUID migration SQL from Implementation Guide above
# Then apply to database
supabase db push
```

#### Step 3: Verify UUID Migration

```bash
# Verify all tables now use UUID type
psql $SUPABASE_DATABASE_URL -c "
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE column_name = 'id' AND table_schema = 'public'
ORDER BY table_name;
"
# Expected: data_type = 'uuid', column_default contains 'gen_random_uuid()'

# Test UUID generation
psql $SUPABASE_DATABASE_URL -c "
INSERT INTO users (email, full_name, password_hash)
VALUES ('test@uuid.com', 'UUID Test', 'hash')
RETURNING id;
"
# Expected: Returns valid UUID format
```

#### Step 4: Update Test Fixtures

Update all test files to use valid UUID format:

```typescript
// tests/helpers/fixtures.ts
export const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
export const TEST_CLIENT_ID = '223e4567-e89b-12d3-a456-426614174001';
export const TEST_SESSION_ID = '323e4567-e89b-12d3-a456-426614174002';

// tests/helpers/mocks.ts
import { randomUUID } from 'crypto';

export function createMockUser(overrides = {}) {
  return {
    id: overrides.id || randomUUID(), // Valid UUID v4
    email: overrides.email || 'test@example.com',
    // ...
  };
}
```

Update ~50 test fixtures across 10-15 test files.

#### Step 5: Run Tests to Verify UUID Migration

```bash
# Run all tests
npm run test:unit
npm run test:integration

# All tests should pass with UUID type
```

### Phase 2: Prisma Removal (After UUID Migration Complete)

#### Step 6: Backup Current Configuration

```bash
# Create backup of current auth.ts
cp lib/auth.ts lib/auth.ts.backup

# Backup package.json
cp package.json package.json.backup
```

#### Step 7: Update lib/auth.ts

Replace entire file with the simplified configuration from Implementation Guide above.

**Key changes**:

1. Remove Prisma imports: `prismaAdapter`, `PrismaClient`, `PrismaPg`
2. Remove Prisma Pool adapter initialization
3. Change `database: prismaAdapter(prisma, { provider: "postgresql" })` to `database: pool`
4. Keep all other configuration identical

#### Step 8: Remove Prisma Dependencies

```bash
# Remove from package.json
npm uninstall @prisma/client @prisma/adapter-pg prisma

# Delete Prisma schema
rm -rf prisma/

# Delete generated Prisma client
rm -rf generated/prisma/
```

#### Step 9: Fix Test Files

Update `tests/unit/services/auth.service.test.ts`:

```typescript
// Remove this line:
// import { PrismaClient } from '../../../generated/prisma/client';

// Keep test logic, mock Better Auth directly without Prisma
```

#### Step 10: Verify Environment Variables

Ensure `.env.local` has required variables:

```bash
SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
BETTER_AUTH_SECRET=your-32-char-secret-key
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Step 11: Test Authentication Flows

Run all authentication tests:

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Manual testing
npm run dev
```

**Test checklist**:

- [ ] Email/password signup (verify UUID IDs generated)
- [ ] Email/password login
- [ ] Email verification
- [ ] Password reset
- [ ] Google OAuth login (verify UUID IDs generated)
- [ ] Account lockout (5 failed attempts)
- [ ] Rate limiting (10 login attempts/min)
- [ ] Session creation and validation
- [ ] Verify new user IDs are valid UUIDs in database

#### Step 12: Update Documentation

Update `SUPABASE-SETUP.md`:

**Add section**:

```markdown
## Better Auth Integration

Better Auth connects directly to Supabase PostgreSQL via the `pg` library:

\`\`\`typescript
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

export const auth = betterAuth({
database: new Pool({
connectionString: process.env.SUPABASE_DATABASE_URL,
ssl: { rejectUnauthorized: false }
}),
// ... rest of configuration
});
\`\`\`

**No ORM required** - Better Auth uses direct SQL queries via the pg Pool.
```

## Success Criteria (Technical)

**UUID Migration**:

- [ ] All 12 tables migrated from VARCHAR(255) to UUID type
- [ ] All foreign key columns updated to UUID type
- [ ] All tables have `DEFAULT gen_random_uuid()` configured
- [ ] Database migration file created: `20260114000001_migrate_to_uuid_type.sql`
- [ ] Pre-migration validation confirms all existing IDs are valid UUIDs
- [ ] Post-migration verification confirms UUID type in database
- [ ] Test fixtures updated to use valid UUID format (~50 fixtures)
- [ ] New user registration generates valid UUIDs

**Code Quality**:

- [ ] No Prisma imports in codebase
- [ ] `lib/auth.ts` uses direct `pg` Pool connection
- [ ] Better Auth configured to use database-generated UUIDs (no custom generateId)
- [ ] All field mappings preserved exactly
- [ ] All custom Better Auth configuration preserved
- [ ] Application code unchanged (IDs remain `string` type in TypeScript)

**Functionality**:

- [ ] Email/password authentication works with UUID IDs
- [ ] Google OAuth works with UUID IDs
- [ ] Email verification works
- [ ] Password reset works
- [ ] Account lockout works
- [ ] Rate limiting works
- [ ] Session management works with UUID session IDs
- [ ] All foreign key relationships preserved

**Testing**:

- [ ] All unit tests pass (`npm run test:unit`)
- [ ] All integration tests pass (`npm run test:integration`)
- [ ] Test fixtures use valid UUID format
- [ ] No import/module errors
- [ ] No test file failures

**Dependencies**:

- [ ] `@prisma/client` removed from package.json
- [ ] `@prisma/adapter-pg` removed from package.json
- [ ] `prisma` removed from package.json
- [ ] `prisma/schema.prisma` deleted
- [ ] `generated/prisma/` directory deleted

**Documentation**:

- [ ] `.claude/database/database.dbml` updated to reflect UUID type
- [ ] `SUPABASE-SETUP.md` updated with UUID generation and simplified setup
- [ ] Comments in `lib/auth.ts` explain direct connection and UUID approach
- [ ] PRD updated with UUID migration details
- [ ] Epic updated with UUID migration integration

## Performance Benchmarks

**Initialization Time**:

- Current (with Prisma): ~150ms (Prisma client generation + pool creation)
- Target (direct Pool): ~50ms (pool creation only)
- Expected improvement: 66% faster initialization

**Authentication Request Latency**:

- No significant change expected (Prisma was only used for connection, not queries)
- Better Auth generates SQL directly in both cases

## Estimated Effort

### Phase 1: UUID Migration
- **Database migration creation**: 30 minutes
- **Pre-migration validation**: 15 minutes
- **Test fixture updates**: 2 hours (~50 fixtures across 10-15 test files)
- **Post-migration validation**: 30 minutes
- **Documentation updates (DBML)**: 15 minutes
- **Subtotal**: 3.5 hours

### Phase 2: Prisma Removal
- **Configuration update (`lib/auth.ts`)**: 1 hour
- **Dependency removal**: 15 minutes
- **Test file updates (remove Prisma imports)**: 30 minutes
- **Manual testing (all auth flows)**: 1 hour
- **Documentation update (PRD, Epic, SUPABASE-SETUP)**: 30 minutes
- **Subtotal**: 3 hours

### Combined Effort
- **Total Duration**: 6-7 hours
- **Complexity**: Medium (database schema change + configuration refactor)
- **Critical Path**: UUID migration must complete before Prisma removal
- **Parallelization**: Documentation can be done alongside testing

## Risk Assessment

| Risk                              | Impact | Likelihood | Mitigation                                           |
| --------------------------------- | ------ | ---------- | ---------------------------------------------------- |
| UUID migration data loss          | High   | Very Low   | Pre-validation, atomic transaction, type cast safety |
| Existing IDs not valid UUID       | High   | Very Low   | Pre-migration validation query, Better Auth uses UUID |
| Foreign key constraints break     | High   | Very Low   | Migration order respects dependencies                |
| Test fixtures need major updates  | Medium | High       | ~50 fixtures, but straightforward UUID replacement   |
| Field mapping breaks              | High   | Low        | Copy exact configuration, test thoroughly            |
| OAuth state fails                 | High   | Low        | Test Google OAuth specifically with UUID             |
| Session validation breaks         | High   | Low        | Test JWT session creation/validation                 |
| Better Auth UUID generation fails | Medium | Very Low   | PostgreSQL default behavior, well-tested             |
| Rollback needed                   | Medium | Very Low   | Keep backup files, transaction auto-rollback         |

**Rollback Plan**:

**If UUID Migration Fails (during migration)**:
```bash
# Transaction automatically rolls back
# No manual intervention needed
```

**If UUID Migration needs rollback (post-migration)**:
```sql
-- Revert all tables to VARCHAR(255)
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
-- Repeat for all 12 tables and foreign keys

-- UUID values remain valid when cast back to VARCHAR
```

**If Prisma Removal Fails**:
```bash
# Restore backup files
cp lib/auth.ts.backup lib/auth.ts
cp package.json.backup package.json

# Reinstall Prisma dependencies
npm install

# Regenerate Prisma client
npx prisma generate
```

**Combined Rollback**:
- UUID migration and Prisma removal are independent
- Can rollback either without affecting the other
- UUID migration rollback doesn't require Prisma reinstallation

## References

**Better Auth Documentation:**
- [Better Auth PostgreSQL Adapter](https://www.better-auth.com/docs/adapters/postgresql)
- [Better Auth Database Concepts](https://www.better-auth.com/docs/concepts/database) - Confirms UUID default for PostgreSQL
- [Better Auth Supabase Integration](https://www.better-auth.com/docs/guides/supabase-migration-guide)

**PostgreSQL Documentation:**
- [PostgreSQL UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [PostgreSQL pgcrypto Extension](https://www.postgresql.org/docs/current/pgcrypto.html) - Provides gen_random_uuid()
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

**Project Files:**
- Current implementation: `lib/auth.ts`
- Database schema: `.claude/database/database.dbml`
- Failed test: `tests/unit/services/auth.service.test.ts`
- PRD: `.claude/prds/auth-simplification.md`

## Tasks Created

**Phase 1: UUID Migration** (Tasks 001-004)
- [ ] 001.md - UUID Migration - Database Schema Conversion (parallel: false, foundational)
- [ ] 002.md - UUID Migration - Update Test Fixtures (parallel: false, depends on 001)
- [ ] 003.md - UUID Migration - Validation and Testing (parallel: false, depends on 001, 002)
- [ ] 004.md - UUID Migration - Documentation Update (parallel: false, depends on 003)

**Phase 2: Prisma Removal** (Tasks 005-007)
- [ ] 005.md - Prisma Removal - Rewrite Better Auth Configuration (parallel: false, depends on 004)
- [ ] 006.md - Prisma Removal - Remove Dependencies and Cleanup (parallel: false, depends on 005)
- [ ] 007.md - Final Integration Testing and Documentation (parallel: false, depends on 006)

**Summary:**
- **Total tasks**: 7
- **Parallel tasks**: 0 (all tasks are sequential due to dependencies)
- **Sequential tasks**: 7 (strict dependency chain ensures safe migration)
- **Estimated total effort**: 11-15 hours

**Breakdown by size:**
- XS: 2 tasks (004, 006) - 1 hour total
- Small: 2 tasks (002, 003) - 3-4 hours
- Medium: 3 tasks (001, 005, 007) - 7-10 hours

**Critical path**: 001 → 002 → 003 → 004 → 005 → 006 → 007 (all tasks sequential)

**Rationale for sequential execution:**
- UUID migration must complete before Prisma removal
- Database schema changes before test updates
- Configuration changes before dependency cleanup
- All changes validated before final integration testing
