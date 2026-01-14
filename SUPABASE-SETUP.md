# Supabase Setup Guide

This guide explains how to set up and configure Supabase PostgreSQL for Korella CRM.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Database Configuration](#database-configuration)
3. [UUID Generation](#uuid-generation)
4. [Better Auth Integration](#better-auth-integration)
5. [Environment Variables](#environment-variables)
6. [Migrations](#migrations)
7. [Troubleshooting](#troubleshooting)

## Initial Setup

### Prerequisites

- Node.js 18+ installed
- Supabase account (https://supabase.com)
- Supabase CLI installed (`npm install -g supabase`)

### Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose organization and project name
4. Select region (choose closest to your users)
5. Generate a strong database password
6. Wait for project to initialize (~2 minutes)

### Initialize Supabase Locally

```bash
# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Pull remote schema (if starting from existing project)
supabase db pull
```

## Database Configuration

### Connection Settings

Korella uses two types of database connections:

1. **Supabase Client** (Client-side, browser-safe)
   - Uses anon/public key
   - For application data queries
   - Handled by `@supabase/supabase-js`

2. **Direct PostgreSQL** (Server-side only)
   - Uses direct connection string
   - For Better Auth authentication
   - Handled by `pg` library

### Connection Pooling

The application uses PostgreSQL connection pooling with these settings:

```typescript
const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  min: 2,          // Minimum connections
  max: 10,         // Maximum connections
  idleTimeoutMs: 30000,
  connectionTimeoutMs: 5000,
});
```

## UUID Generation

### Overview

Korella uses **native PostgreSQL UUID** type for all ID fields across 12 database tables. This provides significant advantages over string-based identifiers.

### Benefits of UUID Type

| Aspect | VARCHAR(255) | UUID | Improvement |
|--------|-------------|------|-------------|
| Storage per ID | 255 bytes | 16 bytes | **93% reduction** |
| Index size (10K users) | ~2.5 MB | ~160 KB | **94% smaller** |
| Comparison speed | String comparison | Binary comparison | **~30% faster** |
| Type safety | None | Database-enforced | **Format validation** |
| Memory efficiency | Large indexes | Smaller indexes | **Better cache fit** |

### PostgreSQL Extension

UUID generation requires the `pgcrypto` extension:

```sql
-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

This extension provides the `gen_random_uuid()` function for automatic UUID generation.

**Note:** The `CREATE EXTENSION IF NOT EXISTS` syntax is safe to run multiple times. PostgreSQL will:
- Create the extension if it doesn't exist
- Do nothing if it already exists
- Never raise an error for duplicate extension creation

### Default UUID Generation

All tables use `gen_random_uuid()` as the default for ID columns:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  -- other columns...
);
```

This generates a **UUID v4** (random) automatically when inserting new records:

```sql
-- UUID is auto-generated
INSERT INTO users (email, full_name)
VALUES ('user@example.com', 'John Doe');
-- Returns: { id: '123e4567-e89b-12d3-a456-426614174000', ... }
```

### UUID Format

PostgreSQL UUIDs are stored as **16-byte binary values** but displayed as strings:

```
123e4567-e89b-12d3-a456-426614174000
└──┬──┘ └─┬─┘ └─┬─┘ └─┬─┘ └────┬────┘
   │      │      │      │       └─ Node (6 bytes)
   │      │      │      └─ Clock sequence (2 bytes)
   │      │      └─ Version and variant (2 bytes)
   │      └─ Time high (2 bytes)
   └─ Time low (4 bytes)
```

**Format characteristics:**
- Total length: 36 characters (with hyphens)
- Hex digits only: `0-9` and `a-f`
- Case-insensitive (lowercase preferred)
- RFC 4122 compliant

### TypeScript Usage

In application code, UUIDs are handled as strings:

```typescript
// TypeScript interface
interface User {
  id: string;  // UUID stored as string
  email: string;
  // ...
}

// Better Auth automatically handles conversion
const user = await auth.api.signUpEmail({
  email: 'user@example.com',
  password: 'secure-password',
});
// user.id is a string representation of UUID
```

### Migration to UUID

If migrating from VARCHAR(255) to UUID:

```sql
-- Safe conversion using type casting
ALTER TABLE users
  ALTER COLUMN id TYPE UUID USING id::uuid;

-- Add default generation
ALTER TABLE users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
```

**Safety notes:**
- Uses `USING id::uuid` to cast existing UUID strings
- Only works if existing values are valid UUID format
- Run in a transaction for atomicity
- Foreign keys update automatically

### Tables Using UUID

All 12 tables in Korella use UUID primary keys:

**Authentication Tables (7):**
- `users` - User accounts
- `oauth_providers` - OAuth provider mappings
- `sessions` - User sessions
- `verification` - Better Auth verification tokens
- `password_resets` - Password reset tokens
- `email_verifications` - Email verification tokens
- `auth_logs` - Authentication audit log

**Client Hub Tables (5):**
- `clients` - Client profiles
- `client_tags` - Client tags
- `client_documents` - Document metadata
- `client_notes` - Client notes
- `client_tasks` - Tasks

### Performance Considerations

**Index Efficiency:**
- UUID indexes are **94% smaller** than VARCHAR(255) indexes
- Smaller indexes fit in memory → faster queries
- Binary comparison is faster than string comparison

**Storage Efficiency:**
- 16 bytes per UUID vs 255 bytes per VARCHAR
- 10,000 users: ~2.5 MB saved per table
- With foreign keys: ~7-10 MB total savings

**Query Performance:**
- JOIN operations are faster (smaller indexes)
- WHERE clauses benefit from binary comparison
- IN clauses with UUIDs are more efficient

## Better Auth Integration

### Direct PostgreSQL Connection

Better Auth connects directly to PostgreSQL using the `pg` library:

```typescript
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const auth = betterAuth({
  database: pool,  // Direct connection, no ORM
  // ... rest of configuration
});
```

**No ORM required** - Better Auth uses direct SQL queries via the pg Pool.

### Automatic UUID Generation

Better Auth automatically uses PostgreSQL's UUID generation:

- **No custom `generateId` configuration needed**
- Uses database default: `gen_random_uuid()`
- UUIDs are generated server-side in PostgreSQL
- Application receives string representation

### Field Mapping

Better Auth maps to our custom schema:

```typescript
export const auth = betterAuth({
  user: {
    modelName: 'users',
    fields: {
      email: 'email',
      name: 'full_name',
      emailVerified: 'email_verified',
    },
  },
  session: {
    modelName: 'sessions',
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
    },
  },
  account: {
    modelName: 'oauth_providers',
    fields: {
      userId: 'user_id',
      providerId: 'provider',
      accountId: 'provider_id',
    },
  },
});
```

## Environment Variables

### Required Variables

Create a `.env.local` file with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Better Auth Configuration
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Getting Supabase Credentials

1. **Project URL and Anon Key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

2. **Database Connection String:**
   - Go to Supabase Dashboard → Settings → Database
   - Copy "Connection string" → Use URI format
   - Replace `[YOUR-PASSWORD]` with your database password
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

### Security Notes

- **Never commit `.env.local`** to version control
- Use different credentials for development and production
- Rotate secrets regularly
- The anon key is safe for client-side (has Row Level Security)
- Database URL is server-side only (never expose to browser)

## Migrations

### Creating Migrations

```bash
# Create a new migration
supabase migration new migration_name

# Example: Create users table
supabase migration new create_users_table
```

This creates a file in `supabase/migrations/[timestamp]_migration_name.sql`

### Migration Best Practices

**Use transactions:**
```sql
BEGIN;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns...
);

COMMIT;
```

**Enable required extensions:**
```sql
-- Always use IF NOT EXISTS
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**Add comments for documentation:**
```sql
COMMENT ON COLUMN users.id IS 'UUID primary key (PostgreSQL native, auto-generated)';
```

### Applying Migrations

**To local database:**
```bash
supabase db reset  # Reset and apply all migrations
```

**To remote database:**
```bash
supabase db push   # Push local migrations to remote
```

**Check migration status:**
```bash
supabase migration list
```

### Migration Order

When creating migrations with foreign keys:

1. Create foundation tables first (e.g., `users`)
2. Create dependent tables second (e.g., `oauth_providers`)
3. Add indexes after tables are created
4. Use `REFERENCES` for foreign keys

Example migration structure:
```sql
BEGIN;

-- Step 1: Create pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Create foundation table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE
);

-- Step 3: Create dependent table
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Step 4: Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_oauth_providers_user_id ON oauth_providers(user_id);

COMMIT;
```

## Troubleshooting

### Common Issues

**1. Extension not enabled:**
```
ERROR: function gen_random_uuid() does not exist
```
**Solution:** Run `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

**2. Invalid UUID format:**
```
ERROR: invalid input syntax for type uuid
```
**Solution:** Ensure test fixtures use valid UUID format (see `tests/helpers/fixtures.ts`)

**3. Connection refused:**
```
ERROR: connect ECONNREFUSED
```
**Solution:**
- Check `SUPABASE_DATABASE_URL` is correct
- Verify database is accessible (not paused)
- Check SSL configuration

**4. Authentication failed:**
```
ERROR: password authentication failed
```
**Solution:**
- Verify database password in connection string
- Check for special characters (URL-encode if needed)
- Ensure password matches Supabase dashboard

### Verifying UUID Setup

Check that UUID generation is working:

```sql
-- Verify extension exists
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Test UUID generation
SELECT gen_random_uuid();

-- Check table defaults
SELECT column_name, column_default, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';
-- Expected: data_type = 'uuid', column_default contains 'gen_random_uuid()'
```

### Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL UUID Docs:** https://www.postgresql.org/docs/current/datatype-uuid.html
- **Better Auth Docs:** https://www.better-auth.com/docs

## Next Steps

After completing Supabase setup:

1. Run migrations: `supabase db push`
2. Verify tables created: Check Supabase Dashboard → Table Editor
3. Test authentication: Run development server and try signup
4. Check UUID generation: Inspect created user IDs in database
5. Run tests: `npm run test` to verify integration

For authentication configuration details, see `lib/auth.ts`.
For database schema reference, see `.claude/database/database.dbml`.
