---
name: project-setup
status: completed
created: 2026-01-07T02:48:44Z
updated: 2026-01-08T03:27:37Z
completed: 2026-01-08T03:27:37Z
progress: 100%
prd: .claude/prds/project-setup.md
github: null
---

# Epic: Project Setup

## Overview

This epic establishes the complete local development environment for Korella CRM. The implementation focuses on creating a working Next.js 15 application with all third-party services configured, tested, and documented. The goal is to reach a state where `npm run dev` starts successfully with all 8 external services (Supabase, Google OAuth, Resend, Sentry, Vercel, etc.) properly integrated and validated.

**Key Deliverable**: A fully functional development environment where feature development (User Authentication, Client Hub) can begin immediately without infrastructure blockers.

---

## Architecture Decisions

### 1. Next.js 15 App Router (Not Pages Router)

**Decision**: Use Next.js 15 with App Router architecture

**Rationale**:

- Server Components reduce JavaScript bundle by 60-70%
- Built-in API routes eliminate need for separate backend
- File-based routing simplifies project structure
- Better alignment with React 19 features

**Implications**:

- Directory structure: `app/` not `pages/`
- Route groups for layout organization: `(auth)`, `(dashboard)`
- Server Components by default, Client Components opt-in with `'use client'`

---

### 2. Monorepo vs Single Package

**Decision**: Single package (not monorepo)

**Rationale**:

- Solo developer initially (no need for workspace complexity)
- All code in one place simplifies development
- Fewer configuration files and build tools
- Can refactor to monorepo later if needed

**Implications**:

- One `package.json` at root
- All features in single codebase
- Simpler CI/CD pipeline

---

### 3. Environment Variable Validation

**Decision**: Implement runtime environment variable validation with Zod

**Rationale**:

- Type-safe access to env vars across codebase
- Fails fast if required credentials missing
- Auto-completion in IDE
- Single source of truth for env var schema

**Implementation**:

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_DATABASE_URL: z.string().url(),
  RESEND_API_KEY: z.string().startsWith('re_'),
  GOOGLE_CLIENT_ID: z.string().endsWith('.apps.googleusercontent.com'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  // ... more vars
});

export const env = envSchema.parse(process.env);
```

---

### 4. Health Check Endpoint Pattern

**Decision**: Create `/api/health` endpoint to validate all service connections

**Rationale**:

- Single endpoint to verify entire setup
- Easy to test with `curl http://localhost:3000/api/health`
- Returns specific failure reasons for debugging
- Can be used by monitoring tools later

**Response Format**:

```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "storage": "accessible",
    "email": "configured",
    "monitoring": "active"
  }
}
```

---

### 5. Progressive Enhancement Strategy

**Decision**: Services configured incrementally, not all-at-once

**Rationale**:

- Can start development with partial setup (e.g., database + Next.js only)
- Each service is independently testable
- Reduces risk of configuration errors
- Allows debugging one service at a time

**Order of Operations**:

1. Next.js + TypeScript + Tailwind (foundational)
2. Supabase database + storage (data layer)
3. Environment variable validation (safety net)
4. Resend email service (independent utility)
5. Sentry monitoring (independent utility)
6. Google OAuth (depends on Next.js routes)
7. Vercel CLI (deployment tooling)
8. Final integration testing (all services together)

---

## Technical Approach

### Frontend Foundation

**Next.js Configuration**:

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Tailwind CSS with custom mobile-first breakpoints
- PWA support with `next-pwa` (offline capability)
- Sentry integration for error tracking

**Project Structure**:

```
app/
├── (auth)/            # Public authentication pages
├── (dashboard)/       # Protected application pages
├── api/
│   ├── health/       # Health check endpoint
│   └── test/         # Service test endpoints
├── layout.tsx        # Root layout with providers
└── page.tsx          # Landing page

lib/
├── env.ts            # Environment variable validation
├── db.ts             # Supabase database client
├── storage.ts        # Supabase storage client
└── email.ts          # Resend email client

components/ui/        # shadcn/ui components (installed as needed)
```

**Key Files to Create**:

1. `lib/env.ts` - Validates all environment variables on startup
2. `lib/db.ts` - Initializes Supabase client with connection pooling
3. `lib/storage.ts` - Configures Supabase Storage with bucket access
4. `lib/email.ts` - Resend client for transactional emails
5. `app/api/health/route.ts` - Service health check endpoint

---

### Backend Services

**Supabase Configuration**:

- **Database**: PostgreSQL 15+ with connection pooling
- **Storage**: Bucket `client-documents` with row-level security
- **CLI**: Installed globally for migration management
- **Local Development**: Linked to remote project (not Docker-based local instance)

**Key Operations**:

```bash
# Initialize Supabase locally
supabase init

# Link to remote project
supabase link --project-ref [project-ref]

# Test connection
supabase db push --dry-run

# Create storage bucket (via Dashboard UI)
```

**OAuth Configuration** (Google):

- GCP Project: "Korella CRM"
- OAuth Consent Screen: External, Development mode
- Authorized Redirect URI: `http://localhost:3000/api/auth/callback/google`
- Scopes: `email`, `profile`

**Email Service** (Resend):

- Use development domain: `onboarding@resend.dev` (no DNS verification needed)
- React Email for templates (installed but not implemented yet)
- Test endpoint: `app/api/test/email/route.ts`

**Error Tracking** (Sentry):

- Platform: Next.js
- Environment: `development`
- Sample Rate: 100% (all errors captured in dev)
- Session Replay: Disabled in development (privacy)

---

### Infrastructure

**Deployment Platform** (Vercel):

- Account created and CLI installed
- Project linked with `vercel link`
- **No deployment yet** - just tooling setup
- Preview deployments will be used for PR reviews later

**Environment Management**:

- `.env.local` for local development (gitignored)
- `.env.example` template committed to repository
- Vercel environment variables configured separately (when deploying)

**Security Measures**:

- Pre-commit hook to scan for leaked secrets (optional but recommended)
- All OAuth apps restricted to localhost during development
- Storage bucket policies enforce authenticated access only
- Sentry PII scrubbing enabled

---

## Implementation Strategy

### Phase 1: Foundation (Tasks 001-003)

**Goal**: Working Next.js application with TypeScript and Tailwind

**Tasks**:

1. Initialize Next.js 15 with TypeScript, ESLint, Tailwind
2. Configure mobile-first breakpoints and project structure
3. Install core dependencies (React Hook Form, Zod, TanStack Query, Zustand)

**Validation**: `npm run dev` runs without errors, app loads at localhost:3000

---

### Phase 2: Database Layer (Tasks 004-005)

**Goal**: Supabase database and storage fully configured

**Tasks**: 4. Create Supabase project, install CLI, link to remote 5. Configure Supabase Storage bucket with test upload

**Validation**: Can query database and upload files from Node.js

---

### Phase 3: External Services (Tasks 006-008)

**Goal**: All third-party services configured and tested

**Tasks**: 6. Set up Google OAuth + Resend email + Sentry monitoring 7. Configure Vercel CLI and test preview deployment 8. Create environment variable validation with Zod

**Validation**: Each service tested independently via test endpoints

---

### Phase 4: Integration & Documentation (Tasks 009-010)

**Goal**: All services working together with complete documentation

**Tasks**: 9. Create health check endpoint + test all services together 10. Document setup process + create `.env.example` template

**Validation**: Health check returns all services healthy, setup guide complete

---

## Task Breakdown Preview

**Total Tasks: 10** (optimized for efficiency)

### Core Infrastructure (3 tasks)

- [ ] **001**: Initialize Next.js 15 with TypeScript + Tailwind + dependencies
- [ ] **002**: Configure project structure (app/, lib/, components/)
- [ ] **003**: Set up ESLint, Prettier, and development tooling

### Database & Storage (2 tasks)

- [ ] **004**: Create Supabase project + CLI setup + database connection
- [ ] **005**: Configure Supabase Storage bucket + test file upload

### External Services (3 tasks)

- [ ] **006**: Set up Google OAuth credentials (GCP project + OAuth consent)
- [ ] **007**: Configure Resend email service + Sentry error tracking
- [ ] **008**: Set up Vercel CLI + link project (no deployment)

### Integration & Validation (2 tasks)

- [ ] **009**: Create environment variable validation + health check endpoint
- [ ] **010**: Test all services + document setup + create `.env.example`

---

## Dependencies

### External Service Dependencies

**Critical Path Services** (must be created in order):

1. **Supabase** (longest provisioning time: 1-2 minutes)
   - Account verification required
   - Project creation via web dashboard
   - Database and storage provisioning

2. **Google Cloud Platform**
   - Google account needed
   - GCP project creation
   - OAuth app configuration

3. **Resend** (quick setup: <5 minutes)
   - Email verification
   - API key generation

4. **Sentry** (quick setup: <5 minutes)
   - Account creation
   - Project creation
   - DSN generation

5. **Vercel** (quick setup: <5 minutes)
   - Account creation
   - CLI installation

**Parallel Services** (can be set up simultaneously):

- Resend, Sentry, and Vercel are independent
- Can configure while waiting for Supabase provisioning

### Internal Dependencies

**Blocked By**:

- None (this is the first epic, no prerequisites)

**Blocks**:

- **User Authentication Epic** - Needs database, OAuth, email service
- **Client Hub Epic** - Needs database, storage
- All future features depend on this setup

### Tool Prerequisites

Must be installed before starting:

- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Git 2.30+ (`git --version`)
- Modern browser (Chrome, Firefox, Safari, Edge)

---

## Success Criteria (Technical)

### Functional Criteria

**1. Development Server Operational**

- ✅ `npm run dev` starts without errors
- ✅ Application loads at http://localhost:3000
- ✅ Hot reload works (edit file, see changes immediately)
- ✅ TypeScript compilation succeeds with zero errors

**2. Database Connectivity**

- ✅ Supabase client initializes successfully
- ✅ Can execute SQL queries from `lib/db.ts`
- ✅ Connection pooling active (verified in Supabase dashboard)
- ✅ Migrations directory exists: `supabase/migrations/`

**3. Storage Functionality**

- ✅ Supabase Storage bucket `client-documents` created
- ✅ Can upload test file via `lib/storage.ts`
- ✅ Can retrieve file via public URL
- ✅ Storage policies prevent unauthorized access

**4. OAuth Configuration**

- ✅ Google OAuth app created in GCP
- ✅ Client ID and Secret in `.env.local`
- ✅ Redirect URI configured: `http://localhost:3000/api/auth/callback/google`
- ✅ Can access OAuth consent screen URL (manual test)

**5. Email Service Ready**

- ✅ Resend API key in `.env.local`
- ✅ Test email sent successfully via `/api/test/email`
- ✅ Email received within 30 seconds
- ✅ HTML and plain text versions render correctly

**6. Error Tracking Active**

- ✅ Sentry DSN configured in Next.js
- ✅ Test error appears in Sentry dashboard
- ✅ Stack trace shows original TypeScript source (source maps working)
- ✅ Environment tagged as "development"

**7. Deployment Tooling**

- ✅ Vercel CLI installed (`vercel --version`)
- ✅ Project linked to Vercel account
- ✅ Can run `vercel dev` successfully
- ✅ Can create preview deployment with `vercel`

**8. Environment Variables Secure**

- ✅ All 15+ variables in `.env.local`
- ✅ No placeholder values (all real credentials)
- ✅ `.env.local` in `.gitignore`
- ✅ `.env.example` template created (no secrets)
- ✅ Zod validation passes on app startup

**9. Health Check Endpoint**

- ✅ `/api/health` returns 200 OK
- ✅ Response includes all service statuses
- ✅ Returns specific error if service unavailable
- ✅ Response time <500ms

**10. Documentation Complete**

- ✅ Setup guide created with step-by-step instructions
- ✅ Credential generation commands documented
- ✅ Troubleshooting section added
- ✅ All service dashboard links provided

---

### Performance Benchmarks

- **Startup Time**: `npm run dev` completes in <30 seconds
- **Database Query**: Test query executes in <100ms
- **Storage Upload**: 1MB file uploads in <2 seconds
- **Email Send**: Test email API call completes in <1 second
- **Health Check**: All services validated in <500ms total

---

### Quality Gates

**Cannot proceed to User Authentication epic until**:

1. All 10 tasks marked complete
2. Health check endpoint passes
3. All services tested with real operations
4. Documentation peer-reviewed (self-review acceptable for solo dev)
5. `.env.example` matches all required variables

---

## Estimated Effort

### Overall Timeline

**Total Estimated Time**: 1-2 days (8-16 hours)

**Breakdown by Phase**:

- Phase 1 (Foundation): 2-3 hours
- Phase 2 (Database): 1-2 hours
- Phase 3 (External Services): 3-5 hours
- Phase 4 (Integration): 2-4 hours

**Waiting Time** (not active work):

- Supabase project provisioning: 1-2 minutes
- Email verifications: 5-30 minutes total
- OAuth app reviews: 0 minutes (instant for development mode)

---

### Resource Requirements

**Developer Time**:

- Solo developer (you)
- Full focus required (cannot multitask during setup)
- Access to personal email for account verifications

**System Requirements**:

- Reliable internet connection (500MB+ package downloads)
- Disk space: 1GB free (for node_modules)
- RAM: 4GB minimum (Next.js dev server)

---

### Critical Path Items

**Longest Dependencies**:

1. **Supabase Account Verification** (5-30 min)
   - Email verification required
   - Cannot link project until verified
   - **Mitigation**: Start with Next.js initialization while waiting

2. **Package Installation** (5-10 min)
   - ~500MB download for node_modules
   - **Mitigation**: Run `npm install` early, continue with account creation

3. **Service Learning Curve** (variable)
   - First time using Supabase, Resend, Sentry
   - Reading documentation takes time
   - **Mitigation**: Follow linked guides in task files

**Parallelization Opportunities**:

- Set up Resend, Sentry, Vercel simultaneously
- Create accounts in multiple browser tabs
- Run `npm install` while configuring GCP OAuth

---

## Risk Mitigation

**High-Impact Risks**:

1. **Service Downtime**
   - Risk: Supabase/Resend unavailable during setup
   - Impact: Cannot complete setup, blocks all work
   - Mitigation: Check service status pages first, have fallback dates

2. **Account Verification Delays**
   - Risk: Email verification takes hours
   - Impact: Delays setup by several hours
   - Mitigation: Start setup in morning, check spam folders

3. **OAuth Misconfiguration**
   - Risk: Redirect URI mismatch causes authentication failures
   - Impact: Wastes time debugging, frustration
   - Mitigation: Copy-paste URIs exactly, verify before saving

4. **Credential Leaks**
   - Risk: Accidentally commit `.env.local` to git
   - Impact: Security breach, need to rotate all credentials
   - Mitigation: Add `.env.local` to `.gitignore` in Task 001

---

## Testing Approach

### Unit Testing

- **NOT REQUIRED** for this epic (infrastructure only)
- Unit tests will be added in User Authentication epic

### Integration Testing

- Each service tested independently via test endpoints
- Example: `app/api/test/email/route.ts` sends test email
- Example: `app/api/test/storage/route.ts` uploads test file

### End-to-End Testing

- Health check endpoint validates all services together
- Manual verification via browser: http://localhost:3000/api/health

### Acceptance Testing

- Developer (you) manually verifies each success criterion
- Checklist provided in Task 010

---

## Implementation Notes

### Order of Operations (Critical)

**DO NOT** deviate from this order:

1. **Next.js first** - Everything depends on having a working app
2. **Supabase second** - Database is foundational for all features
3. **Environment validation third** - Safety net before adding more services
4. **Remaining services** - Order doesn't matter (parallel)
5. **Health check last** - Validates everything together

### Common Pitfalls to Avoid

**❌ Don't**:

- Create Supabase local instance (use remote project directly)
- Deploy to Vercel yet (just link CLI)
- Implement any features (auth, client hub) - only setup
- Create database migrations yet (defer to User Auth epic)
- Set up Microsoft OAuth (explicitly deferred)

**✅ Do**:

- Follow task order exactly
- Test each service immediately after configuration
- Document any deviations or issues encountered
- Keep `.env.local` updated as you go
- Verify health check passes before marking epic complete

---

## Simplified Task Strategy

**Key Optimization**: Combine related setup into single tasks

Instead of:

- ❌ Task 1: Install Node packages
- ❌ Task 2: Configure Tailwind
- ❌ Task 3: Set up TypeScript
- ❌ Task 4: Add ESLint

We do:

- ✅ Task 1: Initialize Next.js with all tooling configured

**Benefits**:

- Fewer context switches
- Natural atomic units of work
- Each task produces a testable milestone
- Total of 10 tasks instead of 20+

---

## Post-Epic Cleanup

After marking this epic complete:

1. **Delete test endpoints**:
   - Remove `app/api/test/` directory (no longer needed)

2. **Review `.gitignore`**:
   - Ensure `.env.local`, `.next/`, `node_modules/` ignored

3. **Create checkpoint commit**:

   ```bash
   git add .
   git commit -m "Setup: Complete development environment configuration

   - Next.js 15 + TypeScript + Tailwind
   - Supabase database + storage configured
   - Google OAuth credentials ready
   - Resend email + Sentry monitoring active
   - All services tested via health check

   Ready for User Authentication epic."
   ```

4. **Update project documentation**:
   - Add setup completion date to `.claude/context/progress.md`
   - Update next steps: "Begin User Authentication epic"

---

## Next Epic Preview

After completing Project Setup:

**Next Epic**: User Authentication (`/pm:epic-decompose user-authentication`)

**Prerequisites Met**:

- ✅ Database connected (for storing users)
- ✅ Google OAuth configured (for social login)
- ✅ Resend configured (for verification emails)
- ✅ Sentry configured (for monitoring auth errors)

**First Task**: Create authentication database tables (001-create-auth-tables.md)
