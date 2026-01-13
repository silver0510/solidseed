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

The current Better Auth integration uses Prisma as an unnecessary middleman between Better Auth and Supabase PostgreSQL. This adds complexity, requires additional dependencies, causes test failures, and goes against Better Auth's recommended integration pattern for PostgreSQL databases.

**Current Issues:**

1. **Unnecessary complexity**: Uses Prisma adapter chain (`pg Pool → PrismaPg adapter → PrismaClient → prismaAdapter → Better Auth`)
2. **Test failures**: `auth.service.test.ts` fails to load due to missing Prisma client generation
3. **Extra dependencies**: Requires `@prisma/client`, `@prisma/adapter-pg`, `prisma` packages
4. **Maintenance overhead**: Need to run `npx prisma generate` after schema changes
5. **Confusion**: Mixes two database access patterns (Supabase client for app data, Prisma for auth data)

**Root Cause:**
Prisma was added under the mistaken belief that it was required for Better Auth + Supabase integration. According to Better Auth's official documentation, **Better Auth can connect directly to PostgreSQL (including Supabase) using just the `pg` library**.

## Goals

### Primary Goals

1. **Simplify authentication setup** - Remove Prisma completely from Better Auth integration
2. **Fix test errors** - Resolve import errors in authentication tests
3. **Reduce dependencies** - Remove unnecessary packages from project
4. **Improve maintainability** - Single database access pattern throughout project

### Secondary Goals

1. **Documentation** - Update setup guides to reflect simplified architecture
2. **Performance** - Reduce initialization overhead by removing Prisma layer
3. **Developer experience** - Eliminate need for Prisma client generation step

## Proposed Solution

### Simplified Architecture

**Before (Current):**

```
Supabase DB → pg Pool → PrismaPg adapter → PrismaClient → prismaAdapter → Better Auth
```

**After (Target):**

```
Supabase DB → pg Pool → Better Auth
```

### Technical Approach

1. **Rewrite `lib/auth.ts`** to use direct PostgreSQL connection:

   ```typescript
   import { betterAuth } from 'better-auth';
   import { Pool } from 'pg';

   export const auth = betterAuth({
     database: new Pool({
       connectionString: process.env.SUPABASE_DATABASE_URL,
       ssl: { rejectUnauthorized: false },
     }),
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
   - Better Auth manages auth tables via `pg` Pool
   - Supabase client manages app tables (clients, documents, etc.)

## User Stories

### As a Developer

- **I want** a simple authentication setup **so that** I can understand and maintain the code easily
- **I want** tests to run without extra setup steps **so that** I can focus on feature development
- **I want** consistent database access patterns **so that** I don't need to learn multiple ORMs

### As a DevOps Engineer

- **I want** fewer dependencies to manage **so that** deployment is simpler
- **I want** no code generation steps **so that** CI/CD pipelines are faster

## Success Criteria

### Must Have

- [ ] Better Auth connects directly to Supabase PostgreSQL via `pg` Pool
- [ ] All Prisma dependencies removed from `package.json`
- [ ] `prisma/schema.prisma` deleted
- [ ] `generated/prisma/` directory deleted
- [ ] All authentication tests passing
- [ ] No import errors in test files

### Nice to Have

- [ ] Updated `SUPABASE-SETUP.md` with simplified setup instructions
- [ ] Performance benchmarks comparing old vs new setup
- [ ] Migration guide for projects still using Prisma

## Technical Constraints

1. **Better Auth table names** must match existing database schema:
   - `users` (with custom fields)
   - `sessions`
   - `oauth_providers`
   - `verification`
   - `auth_logs`

2. **Field mapping** must be preserved exactly as configured in current `lib/auth.ts`

3. **All Better Auth features** must continue working:
   - Email/password authentication
   - Google OAuth
   - Email verification
   - Password reset
   - Account lockout
   - Rate limiting

4. **No database migrations required** - existing tables and data remain unchanged

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

- **Total effort**: 2-3 hours
- **Complexity**: Low (configuration change, not new feature)
- **Testing**: 1 hour (verify all auth flows work)

## Acceptance Criteria

1. **Code simplification**:
   - `lib/auth.ts` uses direct `pg` Pool connection
   - No Prisma imports anywhere in codebase
   - `package.json` has no Prisma dependencies

2. **Functionality preserved**:
   - Users can sign up with email/password
   - Users can sign in with email/password
   - Users can sign in with Google OAuth
   - Email verification works
   - Password reset works
   - Account lockout works
   - Rate limiting works

3. **Tests passing**:
   - All unit tests pass (`npm run test:unit`)
   - All integration tests pass (`npm run test:integration`)
   - No import/module errors

4. **Documentation updated**:
   - `SUPABASE-SETUP.md` reflects new simplified setup
   - Comments in `lib/auth.ts` explain direct connection approach

## References

- [Better Auth PostgreSQL Adapter Docs](https://www.better-auth.com/docs/adapters/postgresql)
- [Better Auth Database Concepts](https://www.better-auth.com/docs/concepts/database)
- [Better Auth Supabase Migration Guide](https://www.better-auth.com/docs/guides/supabase-migration-guide)
- Current implementation: `lib/auth.ts`
- Failed test: `tests/unit/services/auth.service.test.ts`

## Notes

This is a **technical improvement** with no user-facing changes. Authentication functionality remains identical - only the internal implementation is simplified.

The change aligns with Better Auth's official documentation and recommended practices for PostgreSQL integration.
