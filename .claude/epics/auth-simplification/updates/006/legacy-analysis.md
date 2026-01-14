# Legacy Code Analysis for Task 006

**Created**: 2026-01-14T03:43:11Z

## Current Situation

Task 006 successfully removed Prisma packages but found legacy code still importing Prisma. This analysis determines what can be safely deleted.

## Architecture Overview

### ✅ Modern Better Auth System (KEEP)

**Core Files:**
- `lib/auth.ts` - Better Auth configuration (uses pg Pool, no Prisma)
- `app/api/auth/[...all]/route.ts` - Better Auth catch-all handler
- `services/email.service.ts` - Email service (no Prisma, used by Better Auth)

**How it works:**
Better Auth handles ALL authentication through its catch-all route and provides standard endpoints for:
- Sign up/Sign in (email/password + OAuth)
- Session management
- Email verification
- Password resets
- Account management

### ❌ Legacy Custom System (DELETE)

**Duplicate API Routes** (10 files):
All these routes duplicate Better Auth functionality and use Prisma-based services:

1. `app/api/auth/login/route.ts` → Uses `loginUser` from auth.service
2. `app/api/auth/register/route.ts` → Uses `registerUser` from auth.service
3. `app/api/auth/logout/route.ts` → Uses `logoutUser` from session.service
4. `app/api/auth/me/route.ts` → Uses `getUserSubscriptionStatus` from session.service
5. `app/api/auth/verify-email/route.ts` → Uses `verifyEmail` from auth.service
6. `app/api/auth/resend-verification/route.ts` → Uses `resendVerificationEmail` from auth.service
7. `app/api/auth/forgot-password/route.ts` → Uses `requestPasswordReset` from auth.service
8. `app/api/auth/reset-password/route.ts` → Uses `resetPassword` from auth.service
9. `app/api/auth/change-password/route.ts` → Uses `changePassword` from auth.service
10. `app/api/auth/debug/route.ts` → Debug endpoint

**Prisma-Based Services** (5 files):
Only used by the duplicate routes above:

1. `services/auth.service.ts` - Imports `PrismaClient`, `PrismaPg`
2. `services/session.service.ts` - Likely imports Prisma
3. `services/password.service.ts` - Likely imports Prisma
4. `services/security.service.ts` - Likely imports Prisma
5. `services/subscription.service.ts` - Likely imports Prisma

**Utility Scripts** (4 files):
Development scripts that import Prisma:

1. `scripts/seed-test-users.ts`
2. `scripts/clear-auth-data.ts`
3. `scripts/reset-auth-data.ts`
4. `scripts/test-db-connection.ts`

**Test Files**:
1. `app/api/test-prisma/route.ts` - Test endpoint for Prisma
2. `tests/unit/services/auth.service.test.ts` - Tests for deleted services

## Service Usage Analysis

**Services imported by custom routes:**
```
auth.service.ts:
  - loginUser (by login/route.ts)
  - registerUser (by register/route.ts)
  - verifyEmail (by verify-email/route.ts)
  - resendVerificationEmail (by resend-verification/route.ts)
  - requestPasswordReset (by forgot-password/route.ts)
  - resetPassword (by reset-password/route.ts)
  - changePassword (by change-password/route.ts)

session.service.ts:
  - logoutUser (by logout/route.ts)
  - getUserSubscriptionStatus (by me/route.ts)

email.service.ts:
  - Used by lib/auth.ts (Better Auth config)
  - NO PRISMA IMPORTS - KEEP THIS
```

## Better Auth Equivalent Endpoints

After cleanup, these Better Auth endpoints replace the custom routes:

| Legacy Route | Better Auth Endpoint |
|-------------|---------------------|
| POST /api/auth/login | POST /api/auth/sign-in/email |
| POST /api/auth/register | POST /api/auth/sign-up/email |
| POST /api/auth/logout | POST /api/auth/sign-out |
| GET /api/auth/me | GET /api/auth/get-session |
| POST /api/auth/verify-email | POST /api/auth/verify-email |
| POST /api/auth/resend-verification | POST /api/auth/send-verification-email |
| POST /api/auth/forgot-password | POST /api/auth/forget-password |
| POST /api/auth/reset-password | POST /api/auth/reset-password |
| POST /api/auth/change-password | POST /api/auth/change-password |

## Deletion Plan

### Phase 1: Delete Duplicate Routes
```bash
rm app/api/auth/login/route.ts
rm app/api/auth/register/route.ts
rm app/api/auth/logout/route.ts
rm app/api/auth/me/route.ts
rm app/api/auth/verify-email/route.ts
rm app/api/auth/resend-verification/route.ts
rm app/api/auth/forgot-password/route.ts
rm app/api/auth/reset-password/route.ts
rm app/api/auth/change-password/route.ts
rm app/api/auth/debug/route.ts
rm app/api/test-prisma/route.ts

# Remove empty directories
rmdir app/api/auth/login 2>/dev/null || true
rmdir app/api/auth/register 2>/dev/null || true
# ... etc for all empty dirs
```

### Phase 2: Delete Prisma Services
```bash
rm services/auth.service.ts
rm services/session.service.ts
rm services/password.service.ts
rm services/security.service.ts
rm services/subscription.service.ts

# KEEP: services/email.service.ts (used by Better Auth)
```

### Phase 3: Delete Utility Scripts
```bash
rm scripts/seed-test-users.ts
rm scripts/clear-auth-data.ts
rm scripts/reset-auth-data.ts
rm scripts/test-db-connection.ts
```

### Phase 4: Delete Test Files
```bash
rm tests/unit/services/auth.service.test.ts
```

### Phase 5: Verification
```bash
# Check for remaining Prisma imports
grep -r "from.*prisma" --include="*.ts" --include="*.js"

# Check for service imports in app/
grep -r "from.*@/services" app/ --include="*.ts"

# Should only find email.service.ts in lib/auth.ts
```

## Risk Assessment

**Very Low Risk:**
- ✅ All deleted routes are duplicates of Better Auth functionality
- ✅ Better Auth is already configured and tested (tasks 001-005)
- ✅ Services are only used by routes being deleted
- ✅ lib/auth.ts uses email.service.ts (which we're keeping)
- ✅ Can create backup branch before deletion

## Success Criteria

After cleanup:
- ✅ No Prisma imports anywhere in codebase
- ✅ TypeScript compiles without errors
- ✅ Better Auth catch-all route handles all auth
- ✅ email.service.ts remains (used by Better Auth)
- ✅ Tests pass
- ✅ Application starts without errors

## Next Steps

1. Create backup: `git branch backup/before-legacy-removal`
2. Execute deletion in phases (with commits after each phase)
3. Run verification checks
4. Update task 006 to closed
5. Proceed to task 007 (final testing)
