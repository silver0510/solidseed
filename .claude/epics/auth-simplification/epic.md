---
name: auth-simplification
status: backlog
created: 2026-01-13T07:34:54Z
progress: 0%
prd: ../../prds/auth-simplification.md
github: [Will be updated when synced to GitHub]
---

# Epic: Authentication Simplification

## Overview

Remove unnecessary Prisma ORM dependency from Better Auth integration by connecting directly to Supabase PostgreSQL using the `pg` library Pool adapter. This simplifies the authentication stack, eliminates test failures caused by missing Prisma client generation, and reduces maintenance overhead while preserving all existing authentication functionality.

## Architecture Decisions

### 1. Direct PostgreSQL Connection via pg Pool

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

### 2. Preserve All Field Mappings and Custom Configuration

**Decision**: Keep all existing Better Auth configuration (field mappings, custom fields, hooks, etc.) exactly as-is, only changing the database adapter.

**Rationale**:

- No database schema changes required
- Zero impact on user-facing functionality
- Reduces migration risk
- All existing data remains valid

**Trade-offs**:

- Must carefully preserve all field mapping configuration
- Need thorough testing to ensure nothing breaks

**Mitigation**:

- Copy exact configuration from current `lib/auth.ts`
- Test all authentication flows (email/password, OAuth, verification, reset)

### 3. Single Database Access Pattern

**Decision**: Use Supabase client for all application data, Better Auth uses raw `pg` Pool only for auth tables.

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

### Database Schema

**Reference**: See `.claude/database/database.dbml` for existing schema and conventions.

**Existing Tables Used** (No changes):

- `users` - Core user accounts with custom fields
- `oauth_providers` - OAuth provider mappings
- `sessions` - Session management
- `verification` - Better Auth verification tokens
- `password_resets` - Password reset tokens (custom)
- `email_verifications` - Email verification tokens (custom)
- `auth_logs` - Authentication audit log (custom)

**No New Tables**: This is a refactoring task with no schema changes.

**No Database Migrations Required**: All tables already exist in Supabase.

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

### Step 1: Backup Current Configuration

```bash
# Create backup of current auth.ts
cp lib/auth.ts lib/auth.ts.backup

# Backup package.json
cp package.json package.json.backup
```

### Step 2: Update lib/auth.ts

Replace entire file with the simplified configuration from Implementation Guide above.

**Key changes**:

1. Remove Prisma imports: `prismaAdapter`, `PrismaClient`, `PrismaPg`
2. Remove Prisma Pool adapter initialization
3. Change `database: prismaAdapter(prisma, { provider: "postgresql" })` to `database: pool`
4. Keep all other configuration identical

### Step 3: Remove Prisma Dependencies

```bash
# Remove from package.json
npm uninstall @prisma/client @prisma/adapter-pg prisma

# Delete Prisma schema
rm -rf prisma/

# Delete generated Prisma client
rm -rf generated/prisma/
```

### Step 4: Fix Test Files

Update `tests/unit/services/auth.service.test.ts`:

```typescript
// Remove this line:
// import { PrismaClient } from '../../../generated/prisma/client';

// Keep test logic, mock Better Auth directly without Prisma
```

### Step 5: Verify Environment Variables

Ensure `.env.local` has required variables:

```bash
SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
BETTER_AUTH_SECRET=your-32-char-secret-key
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 6: Test Authentication Flows

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

- [ ] Email/password signup
- [ ] Email/password login
- [ ] Email verification
- [ ] Password reset
- [ ] Google OAuth login
- [ ] Account lockout (5 failed attempts)
- [ ] Rate limiting (10 login attempts/min)
- [ ] Session creation and validation

### Step 7: Update Documentation

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

**Code Quality**:

- [ ] No Prisma imports in codebase
- [ ] `lib/auth.ts` uses direct `pg` Pool connection
- [ ] All field mappings preserved exactly
- [ ] All custom Better Auth configuration preserved

**Functionality**:

- [ ] Email/password authentication works
- [ ] Google OAuth works
- [ ] Email verification works
- [ ] Password reset works
- [ ] Account lockout works
- [ ] Rate limiting works
- [ ] Session management works

**Testing**:

- [ ] All unit tests pass (`npm run test:unit`)
- [ ] All integration tests pass (`npm run test:integration`)
- [ ] No import/module errors
- [ ] No test file failures

**Dependencies**:

- [ ] `@prisma/client` removed from package.json
- [ ] `@prisma/adapter-pg` removed from package.json
- [ ] `prisma` removed from package.json
- [ ] `prisma/schema.prisma` deleted
- [ ] `generated/prisma/` directory deleted

**Documentation**:

- [ ] `SUPABASE-SETUP.md` updated with simplified setup
- [ ] Comments in `lib/auth.ts` explain direct connection approach

## Performance Benchmarks

**Initialization Time**:

- Current (with Prisma): ~150ms (Prisma client generation + pool creation)
- Target (direct Pool): ~50ms (pool creation only)
- Expected improvement: 66% faster initialization

**Authentication Request Latency**:

- No significant change expected (Prisma was only used for connection, not queries)
- Better Auth generates SQL directly in both cases

## Estimated Effort

- **Total Duration**: 2-3 hours
- **Breakdown by Area**:
  - Configuration update (`lib/auth.ts`): 30 minutes
  - Dependency removal: 15 minutes
  - Test file updates: 30 minutes
  - Manual testing (all auth flows): 60 minutes
  - Documentation update: 15 minutes
- **Critical Path**: Sequential (each step depends on previous)

## Risk Assessment

| Risk                      | Impact | Likelihood | Mitigation                                |
| ------------------------- | ------ | ---------- | ----------------------------------------- |
| Field mapping breaks      | High   | Low        | Copy exact configuration, test thoroughly |
| OAuth state fails         | High   | Low        | Test Google OAuth specifically            |
| Session validation breaks | High   | Low        | Test JWT session creation/validation      |
| Test rewrites complex     | Medium | Low        | Most tests don't use Prisma               |
| Rollback needed           | Medium | Very Low   | Keep backup files, simple git revert      |

**Rollback Plan**:

```bash
# Restore backup files
cp lib/auth.ts.backup lib/auth.ts
cp package.json.backup package.json

# Reinstall Prisma dependencies
npm install

# Regenerate Prisma client
npx prisma generate
```

## References

- [Better Auth PostgreSQL Adapter](https://www.better-auth.com/docs/adapters/postgresql)
- [Better Auth Database Concepts](https://www.better-auth.com/docs/concepts/database)
- [Better Auth Supabase Integration](https://www.better-auth.com/docs/guides/supabase-migration-guide)
- Current implementation: `lib/auth.ts`
- Database schema: `.claude/database/database.dbml`
- Failed test: `tests/unit/services/auth.service.test.ts`
