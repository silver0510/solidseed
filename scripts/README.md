# Authentication Data Management Scripts

Scripts for managing authentication data during development and testing.

## Installation

First, install the required dependencies:

```bash
npm install
```

This will install `tsx` which is needed to run the TypeScript scripts.

## Available Scripts

### 1. Clear Authentication Data

**Clears ALL authentication-related data from the database.**

#### Using TypeScript (Prisma):
```bash
npm run db:clear-auth
```

#### Using SQL (Direct):
```bash
npm run db:clear-auth:sql
```

**What gets deleted:**
- All user accounts
- OAuth provider connections
- Password reset tokens
- Email verification tokens
- Authentication logs
- Active sessions (Better Auth)
- Accounts (Better Auth)
- Verification tokens (Better Auth)

**Use case:** Clean slate for testing authentication flows.

---

### 2. Seed Test Users

**Creates predefined test user accounts.**

```bash
npm run db:seed-users
```

**Test users created:**

| Email                    | Password        | Tier       | Verified | Status |
|-------------------------|-----------------|------------|----------|--------|
| admin@korella.com       | Admin123!       | enterprise | ✓        | active |
| pro@korella.com         | ProUser123!     | pro        | ✓        | active |
| trial@korella.com       | Trial123!       | trial      | ✓        | active |
| free@korella.com        | FreeUser123!    | free       | ✓        | active |
| unverified@korella.com  | Unverified123!  | trial      | ✗        | active |
| locked@korella.com      | Locked123!      | free       | ✓        | locked |

**Use case:** Quickly populate database with test accounts for different scenarios.

---

### 3. Reset Authentication Data

**Clears all data and optionally seeds test users in one command.**

#### Clear only:
```bash
npm run db:reset-auth
```

#### Clear and seed:
```bash
npm run db:reset-auth:seed
```

**Use case:** Complete reset to known state - perfect for starting fresh test runs.

---

## Common Workflows

### Starting Fresh Test Session

```bash
# Clear everything and create test users
npm run db:reset-auth:seed

# Now you can login with any test user
# Example: admin@korella.com / Admin123!
```

### Testing Registration Flow

```bash
# Clear all users
npm run db:clear-auth

# Test registration with fresh database
# Navigate to http://localhost:3000/register
```

### Testing Different User States

```bash
# Reset and seed test users
npm run db:reset-auth:seed

# Login with different accounts:
# - admin@korella.com (enterprise tier, full access)
# - trial@korella.com (trial tier, 7 days remaining)
# - unverified@korella.com (email not verified)
# - locked@korella.com (account locked for 30 min)
```

### Testing Password Reset Flow

```bash
# Seed test users
npm run db:seed-users

# Test forgot password:
# 1. Go to /forgot-password
# 2. Enter: admin@korella.com
# 3. Check console logs for reset token (in dev)
# 4. Use token to reset password
```

---

## Script Files

| File | Description |
|------|-------------|
| `clear-auth-data.ts` | TypeScript script using Prisma to clear data |
| `clear-auth-data.sh` | Bash script using SQL to clear data |
| `seed-test-users.ts` | Creates predefined test user accounts |
| `reset-auth-data.ts` | Combined clear + seed script |

---

## Database Tables Affected

All scripts interact with these tables:

**Authentication Tables:**
- `users` - Main user accounts
- `oauth_providers` - Social login connections
- `password_resets` - Password reset tokens
- `email_verifications` - Email verification tokens
- `auth_logs` - Security audit logs

**Better Auth Tables:**
- `session` - Active user sessions
- `account` - OAuth account mappings
- `verification` - Email verification tokens

---

## Safety Notes

⚠️ **WARNING:** These scripts delete data permanently!

- Only use in **development** environment
- Never run in **production**
- Always backup important data before clearing
- Scripts require `SUPABASE_DATABASE_URL` in `.env.local`

---

## Troubleshooting

### "tsx: command not found"

```bash
npm install
```

Make sure `tsx` is installed in devDependencies.

### "SUPABASE_DATABASE_URL not set"

Create or update `.env.local`:

```env
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

### Permission errors on bash script

```bash
chmod +x scripts/clear-auth-data.sh
```

### Foreign key constraint errors

The scripts delete in the correct order to handle foreign keys. If you still get errors, check:
1. Custom migrations that added new foreign keys
2. Database schema is in sync with Prisma schema

Run Prisma migration to sync:
```bash
npx prisma migrate dev
```

---

## Example Testing Session

Complete workflow for testing authentication:

```bash
# 1. Reset to clean state with test users
npm run db:reset-auth:seed

# 2. Start dev server
npm run dev

# 3. Test different flows:

# Login as admin
# → Go to /login
# → Email: admin@korella.com
# → Password: Admin123!

# Test email verification
# → Go to /register
# → Create new account
# → Check console for verification link

# Test password reset
# → Go to /forgot-password
# → Email: pro@korella.com
# → Check console for reset link

# Test locked account
# → Go to /login
# → Email: locked@korella.com
# → See error: "Account is locked"

# 4. When done, clear all test data
npm run db:clear-auth
```

---

## Integration with Testing

These scripts work great with your test suite:

```bash
# Before running integration tests
npm run db:reset-auth:seed

# Run tests
npm run test

# After tests, cleanup
npm run db:clear-auth
```

Or create a combined script in `package.json`:

```json
{
  "scripts": {
    "test:integration": "npm run db:reset-auth:seed && npm run test && npm run db:clear-auth"
  }
}
```
