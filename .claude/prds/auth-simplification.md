---
name: auth-simplification
description: Simplify Better Auth integration by removing unnecessary Prisma dependency
status: backlog
created: 2026-01-13T07:33:50Z
updated: 2026-01-13T07:33:50Z
priority: high
effort: small
---

# PRD: Authentication Simplification

## Problem Statement

The current Better Auth integration has two main issues that add unnecessary complexity and deviate from Better Auth's recommended patterns:

### Issue 1: Unnecessary Prisma Dependency

The current Better Auth integration uses Prisma as an unnecessary middleman between Better Auth and Supabase PostgreSQL. This adds complexity, requires additional dependencies, causes test failures, and goes against Better Auth's recommended integration pattern for PostgreSQL databases.

**Current Issues:**

1. **Unnecessary complexity**: Uses Prisma adapter chain (`pg Pool → PrismaPg adapter → PrismaClient → prismaAdapter → Better Auth`)
2. **Test failures**: `auth.service.test.ts` fails to load due to missing Prisma client generation
3. **Extra dependencies**: Requires `@prisma/client`, `@prisma/adapter-pg`, `prisma` packages
4. **Maintenance overhead**: Need to run `npx prisma generate` after schema changes
5. **Confusion**: Mixes two database access patterns (Supabase client for app data, Prisma for auth data)

**Root Cause:**
Prisma was added under the mistaken belief that it was required for Better Auth + Supabase integration. According to Better Auth's official documentation, **Better Auth can connect directly to PostgreSQL (including Supabase) using just the `pg` library**.

### Issue 2: Non-Standard ID Type (VARCHAR instead of UUID)

All database tables currently use `VARCHAR(255)` for ID fields instead of PostgreSQL's native `UUID` type. This was done to accommodate CUID format, but Better Auth actually defaults to UUID for PostgreSQL databases.

**Current Issues:**

1. **Storage inefficiency**: VARCHAR(255) uses 255 bytes per ID vs UUID's 16 bytes (93% waste)
2. **Index bloat**: Larger indexes slow down query performance
3. **Non-standard**: Deviates from Better Auth's default PostgreSQL behavior
4. **String comparison overhead**: VARCHAR comparison slower than binary UUID comparison
5. **Unnecessary**: No CUID library in dependencies - Better Auth handles ID generation

**Root Cause:**
The schema was designed with the assumption that CUID was required, but Better Auth documentation confirms: *"By default, Better-Auth will generate UUIDs for the `id` field for all tables, except adapters that use PostgreSQL where we allow the database to generate the UUID automatically."*

## Goals

### Primary Goals

1. **Migrate to native UUID type** - Convert all ID fields from VARCHAR(255) to PostgreSQL UUID
2. **Simplify authentication setup** - Remove Prisma completely from Better Auth integration
3. **Fix test errors** - Resolve import errors in authentication tests
4. **Reduce dependencies** - Remove unnecessary packages from project
5. **Improve maintainability** - Single database access pattern throughout project

### Secondary Goals

1. **Performance optimization** - Reduce storage and improve query performance with UUID type
2. **Documentation** - Update setup guides to reflect simplified architecture
3. **Better Auth alignment** - Use PostgreSQL's default UUID generation as Better Auth recommends
4. **Developer experience** - Eliminate need for Prisma client generation step

## Proposed Solution

### Simplified Architecture

**Before (Current):**

```
Architecture: Supabase DB (VARCHAR IDs) → pg Pool → PrismaPg adapter → PrismaClient → prismaAdapter → Better Auth
ID Type: VARCHAR(255) with CUID format
```

**After (Target):**

```
Architecture: Supabase DB (UUID IDs) → pg Pool → Better Auth
ID Type: PostgreSQL native UUID with gen_random_uuid()
```

### Technical Approach

This solution combines two improvements into a single cohesive update:

#### Part 1: UUID Migration (Database Layer)

1. **Create database migration** `20260114000001_migrate_to_uuid_type.sql`:

   ```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS pgcrypto;

   -- Convert all 12 tables from VARCHAR(255) to UUID
   -- Example for users table:
   ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;
   ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

   -- Convert all foreign key columns
   ALTER TABLE sessions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
   -- ... (repeat for all tables and FKs)
   ```

2. **Update test fixtures** to use valid UUID format:
   - Replace mock IDs like `'user-123'` with valid UUIDs
   - Use Node.js `randomUUID()` for dynamic test data
   - No application code changes needed (IDs remain `string` type in TypeScript)

#### Part 2: Remove Prisma Dependency (Application Layer)

1. **Rewrite `lib/auth.ts`** to use direct PostgreSQL connection:

   ```typescript
   import { betterAuth } from 'better-auth';
   import { Pool } from 'pg';

   export const auth = betterAuth({
     database: new Pool({
       connectionString: process.env.SUPABASE_DATABASE_URL,
       ssl: { rejectUnauthorized: false },
     }),
     // Better Auth automatically uses gen_random_uuid() for PostgreSQL
     // No explicit generateId configuration needed
     // ... rest of config
   });
   ```

2. **Remove Prisma dependencies** from `package.json`:
   - `@prisma/client`
   - `@prisma/adapter-pg`
   - `prisma`

3. **Delete Prisma artifacts**:
   - `prisma/schema.prisma`
   - `generated/prisma/` directory

4. **Update authentication tests** to remove Prisma imports

5. **Use Supabase client consistently** for all database operations:
   - Better Auth manages auth tables via `pg` Pool with native UUID generation
   - Supabase client manages app tables (clients, documents, etc.)

## User Stories

### As a Developer

- **I want** native UUID types for IDs **so that** I benefit from PostgreSQL's optimized UUID storage and indexing
- **I want** a simple authentication setup **so that** I can understand and maintain the code easily
- **I want** tests to run without extra setup steps **so that** I can focus on feature development
- **I want** consistent database access patterns **so that** I don't need to learn multiple ORMs
- **I want** standard PostgreSQL patterns **so that** I can use familiar tools and documentation

### As a DevOps Engineer

- **I want** fewer dependencies to manage **so that** deployment is simpler
- **I want** no code generation steps **so that** CI/CD pipelines are faster
- **I want** smaller database indexes **so that** backups and restores are faster

### As a Database Administrator

- **I want** UUID primary keys **so that** indexes are smaller and queries are faster
- **I want** type-safe ID columns **so that** invalid data cannot be inserted
- **I want** standard PostgreSQL types **so that** I can use built-in tools for analysis

## Success Criteria

### Must Have - UUID Migration

- [ ] All 12 tables migrated from VARCHAR(255) to UUID type
- [ ] All foreign key columns updated to UUID type
- [ ] All tables have `DEFAULT gen_random_uuid()` for primary keys
- [ ] Database migration file created and tested
- [ ] Test fixtures updated to use valid UUID format
- [ ] Database DBML documentation reflects UUID type

### Must Have - Prisma Removal

- [ ] Better Auth connects directly to Supabase PostgreSQL via `pg` Pool
- [ ] Better Auth configured to use database-generated UUIDs
- [ ] All Prisma dependencies removed from `package.json`
- [ ] `prisma/schema.prisma` deleted
- [ ] `generated/prisma/` directory deleted
- [ ] All authentication tests passing
- [ ] No import errors in test files

### Nice to Have

- [ ] Performance benchmarks comparing VARCHAR vs UUID (storage, query speed)
- [ ] Updated `SUPABASE-SETUP.md` with UUID generation and simplified setup instructions
- [ ] Migration guide documenting the UUID + Prisma removal process
- [ ] Automated validation script for UUID format in database

## Technical Constraints

1. **UUID Migration Prerequisites**:
   - All existing ID values must be valid UUID format (for safe casting)
   - Foreign key relationships must be preserved during type conversion
   - Migration must be atomic (single transaction)
   - IDs remain `string` type in TypeScript application code

2. **Better Auth table names** must match existing database schema:
   - `users` (with custom fields)
   - `sessions`
   - `oauth_providers`
   - `verification`
   - `auth_logs`

3. **Field mapping** must be preserved exactly as configured in current `lib/auth.ts`

4. **All Better Auth features** must continue working:
   - Email/password authentication
   - Google OAuth
   - Email verification
   - Password reset
   - Account lockout
   - Rate limiting

5. **Database migration required** - UUID type conversion for all 12 tables and their foreign keys

## Out of Scope

- Changing authentication providers (Google OAuth stays)
- Modifying database schema or table structure
- Adding new authentication features
- Migrating existing user data (no data changes needed)
- Changing Supabase client usage for non-auth tables

## Dependencies

- Requires `pg` package (already installed)
- Requires `better-auth` package (already installed)
- No new dependencies needed

## Risks and Mitigations

| Risk                               | Impact | Likelihood | Mitigation                                  |
| ---------------------------------- | ------ | ---------- | ------------------------------------------- |
| Better Auth field mapping breaks   | High   | Low        | Thoroughly test all auth flows before/after |
| OAuth state management fails       | High   | Low        | Test Google OAuth flow specifically         |
| Session management breaks          | High   | Low        | Test session creation/validation            |
| Existing tests need major rewrites | Medium | Low        | Most tests use Supabase client, not Prisma  |

## Timeline Estimate

### UUID Migration Phase
- **Database migration creation**: 30 minutes
- **Test fixture updates**: 2 hours (~50 fixtures across 10-15 test files)
- **Documentation updates (DBML, PRD, Epic)**: 30 minutes
- **Validation and testing**: 1 hour
- **Subtotal**: 4 hours

### Prisma Removal Phase
- **lib/auth.ts rewrite**: 1 hour
- **Dependency removal and cleanup**: 15 minutes
- **Test file updates (remove Prisma imports)**: 30 minutes
- **Integration testing**: 1 hour
- **Documentation updates**: 15 minutes
- **Subtotal**: 2.5 hours

### Combined Effort
- **Total effort**: 6-7 hours
- **Complexity**: Medium (database schema change + configuration refactor)
- **Testing**: 2 hours (UUID migration validation + auth flows verification)
- **Critical path**: UUID migration must complete before Prisma removal

## Acceptance Criteria

1. **Database modernization**:
   - All 12 tables use native PostgreSQL UUID type for primary keys
   - All foreign key columns use UUID type
   - All tables have `DEFAULT gen_random_uuid()` configured
   - Database migration successfully converts VARCHAR(255) to UUID
   - No data loss or corruption during migration

2. **Code simplification**:
   - `lib/auth.ts` uses direct `pg` Pool connection
   - Better Auth configured to use database-generated UUIDs (no custom generateId)
   - No Prisma imports anywhere in codebase
   - `package.json` has no Prisma dependencies
   - Application code remains unchanged (IDs still treated as `string` in TypeScript)

3. **Functionality preserved**:
   - Users can sign up with email/password
   - Users can sign in with email/password
   - Users can sign in with Google OAuth
   - Email verification works
   - Password reset works
   - Account lockout works
   - Rate limiting works
   - New IDs generated as valid UUIDs

4. **Tests passing**:
   - All unit tests pass (`npm run test:unit`)
   - All integration tests pass (`npm run test:integration`)
   - Test fixtures use valid UUID format
   - No import/module errors

5. **Documentation updated**:
   - `.claude/database/database.dbml` reflects UUID type for all ID columns
   - `SUPABASE-SETUP.md` documents UUID generation and simplified setup
   - Comments in `lib/auth.ts` explain direct connection and UUID approach
   - PRD and Epic documents updated with UUID migration details

## References

**Better Auth Documentation:**
- [Better Auth PostgreSQL Adapter](https://www.better-auth.com/docs/adapters/postgresql)
- [Better Auth Database Concepts](https://www.better-auth.com/docs/concepts/database) - Confirms UUID default for PostgreSQL
- [Better Auth Supabase Migration Guide](https://www.better-auth.com/docs/guides/supabase-migration-guide)

**PostgreSQL Documentation:**
- [PostgreSQL UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [PostgreSQL pgcrypto Extension](https://www.postgresql.org/docs/current/pgcrypto.html)

**Current Implementation:**
- `lib/auth.ts` - Current Prisma-based auth configuration
- `supabase/migrations/` - Current VARCHAR(255) schema
- `tests/unit/services/auth.service.test.ts` - Failed test due to missing Prisma client

## UUID Migration Benefits

| Aspect | VARCHAR(255) | PostgreSQL UUID | Benefit |
|--------|--------------|-----------------|---------|
| **Storage per ID** | 255 bytes | 16 bytes | **93% reduction** |
| **Index size (10K users)** | ~2.5MB | ~160KB | **94% smaller indexes** |
| **Comparison speed** | String comparison | Binary comparison | **~30% faster queries** |
| **Type safety** | Any string valid | Only UUID format | **Enforced at DB level** |
| **Better Auth alignment** | Custom/non-standard | Default behavior | **Standard PostgreSQL pattern** |

**Real-world Impact:**
- **10,000 users**: Save ~25MB in indexes alone
- **100,000 clients**: Save ~250MB across all tables
- **Query performance**: Improved as smaller indexes fit in memory
- **Backup/Restore**: Faster due to reduced data size

## Notes

This is a **technical improvement** with no user-facing changes. Authentication functionality remains identical - only the internal implementation is simplified and the database schema is modernized.

The changes align with Better Auth's official documentation and recommended practices for PostgreSQL integration:

> "By default, Better-Auth will generate UUIDs for the `id` field for all tables, except adapters that use PostgreSQL where we allow the database to generate the UUID automatically."

The UUID migration provides immediate performance benefits while the Prisma removal simplifies the codebase and eliminates unnecessary dependencies.
