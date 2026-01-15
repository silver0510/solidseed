---
task: 005
title: Prisma Removal - Rewrite Better Auth Configuration
analyzed: 2026-01-14T03:08:41Z
estimated_hours: 2.5
parallelization_factor: 1.0
---

# Parallel Work Analysis: task 005

## Overview

Rewrite `lib/auth.ts` to remove Prisma dependency and use direct PostgreSQL connection via `pg` Pool. This is a single-file refactor that removes the Prisma adapter layer while preserving all Better Auth configuration, field mappings, and custom functionality.

## Parallel Streams

### Stream A: Auth Configuration Refactor

**Scope**: Rewrite `lib/auth.ts` to use direct PostgreSQL connection and update all related test files

**Files**:
- `lib/auth.ts` - Complete rewrite removing Prisma, using Pool directly
- `lib/__tests__/auth.test.ts` - Update test mocks if needed
- `services/__tests__/auth.service.test.ts` - Update integration tests

**Agent Type**: backend-specialist

**Can Start**: immediately

**Estimated Hours**: 2.5

**Dependencies**: none

**Detailed Tasks**:
1. Backup current `lib/auth.ts` to `lib/auth.ts.backup`
2. Remove Prisma imports: `prismaAdapter`, `PrismaClient`, `PrismaPg`
3. Remove Prisma client initialization and adapter creation
4. Configure Better Auth to use Pool directly: `database: pool`
5. Remove explicit `generateId` configuration (Better Auth defaults to `gen_random_uuid()`)
6. Preserve all field mappings exactly as-is:
   - `user.modelName` and `user.fields`
   - `user.additionalFields` (all custom fields)
   - `session.modelName` and `session.fields`
   - `account.modelName` and `account.fields`
   - `verification.modelName` and `verification.fields`
7. Preserve all authentication configuration:
   - `emailAndPassword` settings
   - `socialProviders` (Google OAuth)
   - `session` configuration (JWT, refresh tokens)
   - `emailVerification` settings
   - `rateLimit` configuration
   - `account` security features
8. Add comments explaining:
   - Direct PostgreSQL connection (no Prisma layer)
   - UUID auto-generation via `gen_random_uuid()`
   - Better Auth's default PostgreSQL adapter behavior
9. Update imports to remove all Prisma dependencies
10. Verify TypeScript types still infer correctly (Session, User types)
11. Update auth service tests to reflect new architecture
12. Run unit tests: `npm run test:unit` for auth module
13. Verify all tests pass

## Coordination Points

### Shared Files

None - this is a single-file refactor with isolated test updates.

### Sequential Requirements

All work happens in Stream A sequentially:
1. Backup original file first
2. Rewrite auth configuration
3. Update tests
4. Verify tests pass

## Conflict Risk Assessment

- **Low Risk**: Single developer working on isolated files
- **No coordination needed**: No parallel streams, no shared files
- **Test isolation**: Auth tests are independent from other modules

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

This task cannot be parallelized effectively because:
- Single file is the primary target (`lib/auth.ts`)
- Changes are tightly coupled (removing Prisma affects entire config)
- Test updates depend on seeing the new auth configuration
- Better to do it carefully and sequentially than try to parallelize

Sequential execution ensures:
- Clean backup before changes
- Consistent configuration through entire file
- Tests updated after seeing new structure
- No merge conflicts or coordination overhead

## Expected Timeline

With sequential execution:
- Wall time: 2.5 hours
- Total work: 2.5 hours
- Efficiency gain: 0% (not parallelizable)

Without parallel execution:
- Wall time: 2.5 hours

## Notes

### Why No Parallelization?

This task is inherently sequential because:
1. **Single core file**: `lib/auth.ts` is the main target
2. **Tight coupling**: All config sections depend on the same database setup
3. **Testing dependency**: Tests need to see the complete new configuration
4. **Risk mitigation**: Better to refactor carefully in one pass

### Key Risks to Mitigate

1. **Lost configuration**: Backup file first, verify all field mappings preserved
2. **Type safety**: Ensure TypeScript types still infer after removing Prisma
3. **Breaking tests**: Update test mocks to match new architecture
4. **Runtime errors**: Test all auth flows (email/password, OAuth, verification)

### Success Criteria

- ✅ No Prisma imports remain in `lib/auth.ts`
- ✅ All field mappings preserved exactly
- ✅ All custom configuration preserved
- ✅ Comments added explaining new architecture
- ✅ TypeScript compiles without errors
- ✅ All auth unit tests pass
- ✅ No functionality regression

### Reference Sections

From epic.md:
- **Part 2: Prisma Removal** (lines 269-591) - Complete rewritten configuration
- **Migration Steps Phase 2: Step 7** - Key changes checklist
- **Architecture Decisions #2** - Rationale for direct PostgreSQL connection
