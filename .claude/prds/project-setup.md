---
name: project-setup
description: Infrastructure and development environment setup for Korella CRM
status: backlog
created: 2026-01-07T02:41:27Z
---

# PRD: Project Setup

## Executive Summary

Before implementing any features of Korella CRM, we need a fully configured development environment with all necessary third-party services, API credentials, and local infrastructure. This PRD defines the complete setup process to go from an empty directory to a running Next.js application with database, authentication, email, and monitoring services configured and tested.

**Value Proposition**: Establishes the foundation for rapid feature development with all services integrated, tested, and documented.

---

## Problem Statement

### What problem are we solving?

Currently, the Korella CRM project exists only as planning documents in `.claude/` directory. Before any feature implementation can begin (User Authentication, Client Hub), we need:

1. **Development Infrastructure** - A working Next.js application with all dependencies installed
2. **Database & Storage** - Supabase project with connection established
3. **Authentication Services** - Google OAuth configured and ready for Better Auth integration
4. **Email Service** - Resend account for sending verification emails
5. **Monitoring** - Sentry project for error tracking
6. **Deployment Platform** - Vercel account configured for future deployments
7. **Secure Credentials** - All API keys and secrets properly generated and stored

### Why is this important now?

- **Blocks all feature development** - Can't build User Authentication without OAuth credentials and database
- **Prevents integration issues** - Setting up services upfront avoids last-minute integration problems
- **Enables parallel work** - Once setup is complete, multiple features can be developed simultaneously
- **Validates tech stack** - Confirms all chosen technologies work together as expected

---

## User Stories

### Primary Persona: Developer (You)

**User Story 1: Initialize Next.js Application**
```
AS A developer
I WANT to initialize a Next.js 15 project with TypeScript and Tailwind CSS
SO THAT I have a working application foundation to build features on
```

**Acceptance Criteria:**
- Next.js 15 project created with App Router
- TypeScript configured with strict mode
- Tailwind CSS v4 installed and configured
- Mobile-first breakpoints defined (xs: 375px, sm: 640px, md: 768px, lg: 1024px)
- Project runs successfully with `npm run dev`
- Default Next.js welcome page loads at http://localhost:3000

---

**User Story 2: Configure Supabase Database**
```
AS A developer
I WANT a Supabase project with connection credentials
SO THAT I can create database migrations and store application data
```

**Acceptance Criteria:**
- Supabase account created (free tier)
- New project created with name "korella-crm"
- Supabase CLI installed globally (`npm install -g supabase`)
- Local project initialized (`supabase init`)
- Remote project linked (`supabase link`)
- Connection credentials saved to `.env.local`
- Test connection successful (can query database from Node.js)
- Supabase Studio accessible via web browser

**Pain Points Addressed:**
- No need to install/manage PostgreSQL locally
- Automatic backups and connection pooling included
- Web UI for database management

---

**User Story 3: Enable Supabase Storage**
```
AS A developer
I WANT Supabase Storage configured for file uploads
SO THAT the Client Hub can store client documents (PDFs, images, contracts)
```

**Acceptance Criteria:**
- Storage enabled in Supabase project
- Storage bucket created: `client-documents`
- Public access policies configured (row-level security)
- Storage credentials available in `.env.local`
- Test file upload successful from Node.js
- Can retrieve uploaded file via public URL

---

**User Story 4: Set Up Google OAuth**
```
AS A developer
I WANT Google OAuth 2.0 credentials configured
SO THAT users can sign in with their Google accounts
```

**Acceptance Criteria:**
- Google Cloud Platform account created
- New GCP project created: "Korella CRM"
- OAuth consent screen configured (external, development mode)
- OAuth 2.0 Client ID created (Web application)
- Authorized redirect URIs added: `http://localhost:3000/api/auth/callback/google`
- Client ID and Client Secret saved to `.env.local`
- OAuth scopes configured: `email`, `profile`

**Note:** Microsoft Azure OAuth deferred to later epic (Phase 2)

---

**User Story 5: Configure Resend Email Service**
```
AS A developer
I WANT Resend configured for transactional emails
SO THAT the authentication system can send verification emails
```

**Acceptance Criteria:**
- Resend account created (free tier: 3K emails/month)
- API key generated
- Domain verification completed (or use Resend test domain for development)
- API key saved to `.env.local`
- Test email sent successfully to personal email
- React Email package installed for JSX email templates

---

**User Story 6: Set Up Sentry Monitoring**
```
AS A developer
I WANT Sentry error tracking configured
SO THAT I can monitor errors and performance in development
```

**Acceptance Criteria:**
- Sentry account created (free tier: 5K events/month)
- New project created: "korella-crm" (Next.js platform)
- DSN (Data Source Name) obtained
- `@sentry/nextjs` installed
- Sentry initialized in Next.js (`sentry.client.config.ts`, `sentry.server.config.ts`)
- DSN saved to `.env.local`
- Test error sent successfully to Sentry dashboard
- Can view error with stack trace in Sentry UI

---

**User Story 7: Configure Vercel Account**
```
AS A developer
I WANT a Vercel account connected to the project
SO THAT I can deploy to staging and production later
```

**Acceptance Criteria:**
- Vercel account created (free tier)
- Vercel CLI installed (`npm install -g vercel`)
- Project linked to Vercel (`vercel link`)
- Can run `vercel dev` successfully
- Preview deployment tested (via `vercel`)
- Custom domain availability verified for `app.korella.com`

**Note:** Actual staging/production deployment deferred to later epic

---

**User Story 8: Secure Credential Management**
```
AS A developer
I WANT all API keys and secrets documented and securely stored
SO THAT I can configure the application without exposing sensitive data
```

**Acceptance Criteria:**
- `.env.local` file created (gitignored)
- `.env.example` template created (committed to git)
- All required environment variables documented with descriptions
- Better Auth secret generated (32-character secure random string)
- JWT secret generated (256-bit secure random key)
- Credential generation commands documented
- No secrets committed to git (verified with `git status`)

---

## Requirements

### Functional Requirements

**FR-1: Next.js Application Initialization**
- Create Next.js 15 project with TypeScript
- Configure Tailwind CSS with mobile-first breakpoints
- Install core dependencies (React Hook Form, Zod, TanStack Query, Zustand)
- Set up project structure (app/, components/, lib/, features/)
- Configure ESLint and Prettier

**FR-2: Database Configuration**
- Create Supabase project
- Initialize Supabase CLI locally
- Link local project to remote Supabase
- Test database connection
- Create initial migrations directory structure

**FR-3: Storage Configuration**
- Enable Supabase Storage
- Create storage bucket for client documents
- Configure storage policies
- Test file upload/download

**FR-4: OAuth Provider Setup**
- Create Google Cloud Platform project
- Configure OAuth consent screen
- Generate OAuth 2.0 credentials
- Test OAuth flow (manual redirect test)

**FR-5: Email Service Setup**
- Create Resend account
- Generate API key
- Install React Email package
- Send test email to verify configuration

**FR-6: Error Tracking Setup**
- Create Sentry project
- Install Sentry Next.js SDK
- Configure Sentry in Next.js
- Test error reporting

**FR-7: Deployment Platform Setup**
- Create Vercel account
- Install Vercel CLI
- Link project to Vercel
- Test preview deployment

**FR-8: Environment Variables Management**
- Create `.env.local` with all required variables
- Create `.env.example` template
- Document credential generation process
- Add `.env.local` to `.gitignore`

### Non-Functional Requirements

**NFR-1: Security**
- No API keys or secrets committed to git repository
- All secrets generated with cryptographically secure methods
- OAuth credentials restricted to localhost for development
- Storage policies prevent unauthorized access

**NFR-2: Documentation**
- Every service setup documented with step-by-step instructions
- Credential generation commands provided
- Troubleshooting section for common issues
- Links to official documentation for each service

**NFR-3: Reliability**
- All service configurations tested before marking complete
- Database connection pooling configured
- Error handling for service initialization failures
- Health check endpoint to verify all services

**NFR-4: Developer Experience**
- Single command to start development server (`npm run dev`)
- Clear error messages if environment variables missing
- TypeScript types for all environment variables
- Auto-completion for environment variables in IDE

**NFR-5: Cost Efficiency**
- All services use free tier for development
- No credit card required for initial setup
- Cost monitoring enabled for services with usage limits
- Document when to upgrade to paid tiers

---

## Success Criteria

### Measurable Outcomes

**Primary Success Metrics:**

1. **Development Server Starts Successfully**
   - Run `npm run dev` without errors
   - Application loads at http://localhost:3000
   - No TypeScript compilation errors
   - No missing dependency warnings

2. **Database Connection Verified**
   - Can execute `supabase db push` successfully
   - Can query database from Node.js
   - Can view tables in Supabase Studio
   - Connection pooling active

3. **Storage Upload Tested**
   - Can upload a test file to Supabase Storage
   - Can retrieve file via public URL
   - Storage bucket visible in Supabase dashboard
   - Row-level security policies active

4. **OAuth Ready for Integration**
   - Google OAuth credentials in `.env.local`
   - Can access OAuth consent screen URL
   - Redirect URI matches local development URL
   - Credentials valid (tested via manual OAuth flow)

5. **Email Service Functional**
   - Resend API key in `.env.local`
   - Test email received successfully
   - Email delivery time <30 seconds
   - Email renders correctly (HTML + plain text)

6. **Error Tracking Active**
   - Sentry DSN in `.env.local`
   - Test error appears in Sentry dashboard
   - Stack trace captured correctly
   - Source maps working (can see original TypeScript code)

7. **Environment Variables Complete**
   - All 15+ required variables in `.env.local`
   - `.env.example` template created
   - No placeholder values (all real credentials)
   - TypeScript validation passes for env vars

### Key Performance Indicators (KPIs)

- **Setup Completion Time**: <4 hours total (for developer following documentation)
- **Service Availability**: 100% of services accessible and responding
- **Documentation Clarity**: 0 questions needed to complete setup (self-service)
- **Error Rate**: 0 errors when starting development server
- **Test Coverage**: 100% of services tested with real operations

---

## Constraints & Assumptions

### Technical Constraints

1. **Local Development Only**
   - No staging or production environments yet
   - All services configured for `localhost:3000`
   - No custom domain configuration needed

2. **Free Tier Limitations**
   - Supabase: 500MB database, 1GB storage, 50K monthly active users
   - Resend: 3,000 emails/month
   - Sentry: 5,000 events/month
   - Must monitor usage to avoid hitting limits during development

3. **OAuth Development Mode**
   - Google OAuth in "testing" mode (max 100 test users)
   - Can't publish OAuth app without verification
   - Sufficient for development and internal testing

4. **No Microsoft OAuth**
   - Microsoft Azure AD deferred to later epic
   - OAuth configuration will only support Google for now

### Timeline Constraints

- **Estimated Duration**: 1-2 days (including account creation and verification waits)
- **Blocking Factor**: Email verification may take minutes to hours
- **Dependencies**: None (can start immediately)

### Resource Constraints

- **Single Developer**: Setup performed by one person
- **No Budget**: Must use free tiers only
- **No Domain Yet**: Will use Resend test domain for email sending

### Assumptions

1. **Internet Access**: Reliable internet for downloading packages and creating accounts
2. **Email Access**: Working email for account verifications
3. **Node.js Installed**: Node.js 18+ and npm already installed on development machine
4. **Git Initialized**: Git repository already initialized (mentioned by user)
5. **Browser Available**: Modern browser for accessing service dashboards

---

## Out of Scope

### Explicitly NOT Included in This PRD

**❌ Production Deployment**
- No production Vercel deployment
- No production database setup
- No production domain configuration
- No SSL certificate setup
- *Reason*: Focus on local development environment first

**❌ Staging Environment**
- No staging Supabase project
- No staging Vercel deployment
- No staging environment variables
- *Reason*: Deferred until MVP feature development complete

**❌ Microsoft OAuth**
- No Azure AD app registration
- No Microsoft OAuth credentials
- No Microsoft login configuration
- *Reason*: User requested to defer to later epic

**❌ Email Marketing Services**
- No Nylas account setup
- No Inngest configuration
- No email campaign infrastructure
- *Reason*: Phase 2 feature (not needed for MVP)

**❌ CI/CD Pipeline**
- No GitHub Actions setup
- No automated testing pipeline
- No automated deployments
- *Reason*: Manual deployment sufficient for initial development

**❌ Database Migrations**
- No authentication table migrations
- No client hub table migrations
- No actual schema creation
- *Reason*: Handled in User Authentication epic (separate PRD)

**❌ Code Implementation**
- No Better Auth integration code
- No authentication logic
- No UI components
- *Reason*: Infrastructure setup only, no feature code

**❌ Team Collaboration**
- No team member onboarding
- No shared development environment
- No multi-developer workflow
- *Reason*: Solo developer initially

**❌ Monitoring Dashboards**
- No custom Sentry dashboards
- No performance monitoring setup
- No alerting rules
- *Reason*: Default Sentry configuration sufficient for development

**❌ Backup & Recovery**
- No backup strategy
- No disaster recovery plan
- No data retention policies
- *Reason*: Supabase automatic backups sufficient for development

---

## Dependencies

### External Service Dependencies

1. **Supabase**
   - Account creation and email verification
   - Project creation (manual via web UI)
   - Database provisioning time: ~1-2 minutes
   - *Risk*: Service downtime would block setup

2. **Google Cloud Platform**
   - Google account required
   - GCP project creation
   - OAuth consent screen approval (instant for testing mode)
   - *Risk*: Account verification may require phone number

3. **Resend**
   - Email verification required
   - API key generation
   - Domain verification (optional for development)
   - *Risk*: Email deliverability issues during testing

4. **Sentry**
   - Account creation
   - Project setup
   - DSN generation (instant)
   - *Risk*: None (quick setup)

5. **Vercel**
   - Account creation
   - GitHub connection (optional)
   - Project linking
   - *Risk*: None (quick setup)

6. **npm Registry**
   - Package downloads (Next.js, dependencies)
   - ~500MB total download size
   - *Risk*: Network issues or npm downtime

### Internal Dependencies

1. **Git Repository**
   - ✅ Already initialized (user confirmed)
   - `.gitignore` must be configured before credentials added
   - No blocking dependencies

2. **Development Machine**
   - Node.js 18+ installed
   - npm or yarn package manager
   - Terminal/command line access
   - Text editor or IDE

3. **Documentation**
   - `.claude/context/tech-context.md` - Tech stack reference
   - `.claude/context/project-structure.md` - Directory structure guide
   - No blocking dependencies

### Prerequisite Tools

Must be installed before starting:
- Node.js (v18 or higher)
- npm (v9 or higher)
- Git (v2.30 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Post-Setup Dependencies

Services that depend on this setup being complete:
- **User Authentication Epic** - Requires database, OAuth, email service
- **Client Hub Epic** - Requires database, storage
- **Email Marketing Epic** - Requires email service (Resend for transactional)

---

## Technical Details

### Required Environment Variables

All variables must be in `.env.local`:

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Better Auth (to be used in User Auth epic)
BETTER_AUTH_SECRET=[32-char-secret]
BETTER_AUTH_URL=http://localhost:3000

# OAuth - Google
GOOGLE_CLIENT_ID=[client-id].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[client-secret]

# Email (Transactional)
RESEND_API_KEY=re_[api-key]

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
```

### Credential Generation Commands

**Generate Better Auth Secret (32 characters):**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Generate JWT Secret (256-bit):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Directory Structure After Setup

```
Korella/
├── .claude/                  # (existing) Project management
├── .next/                    # (generated) Next.js build output
├── node_modules/             # (generated) Dependencies
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── api/
│       └── health/
│           └── route.ts     # Health check endpoint
├── components/
│   └── ui/                  # (empty for now)
├── lib/
│   ├── db.ts                # Supabase client initialization
│   ├── storage.ts           # Supabase Storage client
│   └── env.ts               # Environment variable validation
├── supabase/
│   ├── config.toml          # Supabase CLI config
│   └── migrations/          # (empty, ready for migrations)
├── public/
│   └── .gitkeep
├── .env.local               # Environment variables (gitignored)
├── .env.example             # Template (committed)
├── .gitignore               # Updated with Next.js + env vars
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
└── README.md                # Project documentation
```

---

## Implementation Notes

### Order of Operations

**Critical Path:**
1. Initialize Next.js project first (needed for all other services)
2. Create Supabase project (longest setup time due to provisioning)
3. Set up Resend (quick, independent)
4. Set up Sentry (quick, independent)
5. Set up Google OAuth (requires domain redirects, so after Next.js)
6. Configure Vercel (depends on Next.js project existing)
7. Create environment variables file (depends on all credentials)
8. Test all services (final validation)

### Testing Strategy

Each service must be tested independently:

**Supabase Database:**
```typescript
// lib/db.ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, anonKey);
// Test: Query pg_catalog.pg_tables
```

**Supabase Storage:**
```typescript
// Test: Upload test.txt file
const { data, error } = await supabase.storage
  .from('client-documents')
  .upload('test.txt', new Blob(['Hello']));
```

**Resend:**
```typescript
// Test: Send email to yourself
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'your-email@example.com',
  subject: 'Resend Test',
  html: '<p>Setup successful!</p>'
});
```

**Sentry:**
```typescript
// Test: Capture test exception
import * as Sentry from '@sentry/nextjs';
Sentry.captureException(new Error('Setup test error'));
```

**Google OAuth:**
```
Manual test: Visit https://accounts.google.com/o/oauth2/v2/auth?client_id=[YOUR_CLIENT_ID]&redirect_uri=http://localhost:3000/api/auth/callback/google&response_type=code&scope=email%20profile
```

### Troubleshooting Guide

**Common Issues:**

1. **Supabase connection fails**
   - Check project is "Active" status in dashboard
   - Verify connection string format
   - Ensure no firewall blocking port 5432

2. **OAuth redirect error**
   - Verify redirect URI matches exactly (including http/https)
   - Check OAuth app is in "Testing" mode
   - Ensure email is added to test users list

3. **Resend emails not received**
   - Check spam folder
   - Verify API key is correct
   - Confirm sender email is allowed in Resend dashboard

4. **Sentry errors not appearing**
   - Wait 1-2 minutes for processing
   - Check DSN is correct
   - Verify environment is "development"

5. **npm run dev fails**
   - Delete `.next` folder and retry
   - Run `npm install` again
   - Check for conflicting processes on port 3000

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Supabase service downtime | Low | High | Use local PostgreSQL as fallback |
| OAuth verification delays | Medium | Medium | Start with email/password auth first |
| Free tier limits exceeded | Low | Low | Monitor usage dashboards |
| Credential leak to git | Medium | High | Pre-commit hook to scan for secrets |
| Service pricing changes | Low | Medium | Lock in grandfathered free tier |
| Account suspension | Very Low | High | Follow service ToS, don't abuse limits |

---

## Acceptance Criteria Summary

Setup is considered **COMPLETE** when:

✅ **1. Development server runs:** `npm run dev` starts without errors
✅ **2. Database connected:** Can execute queries against Supabase PostgreSQL
✅ **3. Storage functional:** Can upload/download files from Supabase Storage
✅ **4. OAuth configured:** Google OAuth credentials ready for Better Auth
✅ **5. Email tested:** Resend can send transactional emails
✅ **6. Monitoring active:** Sentry captures and displays test errors
✅ **7. Vercel linked:** Can deploy preview with `vercel` command
✅ **8. All credentials secure:** No secrets in git, all in `.env.local`
✅ **9. Documentation complete:** `.env.example` and setup guide created
✅ **10. Health check passes:** `/api/health` endpoint returns 200 OK

---

## Next Steps After Completion

Once project setup is complete:

1. **Create Epic:** Run `/pm:prd-parse project-setup` to convert this PRD to implementation epic
2. **Start User Authentication:** Begin User Authentication epic (depends on this setup)
3. **Database Migrations:** Create authentication tables in Supabase
4. **Better Auth Integration:** Configure Better Auth with obtained credentials
5. **First Deployment:** Deploy MVP to Vercel staging environment

---

## Appendix

### Service Links

- **Supabase:** https://app.supabase.com
- **Google Cloud Console:** https://console.cloud.google.com
- **Resend Dashboard:** https://resend.com/dashboard
- **Sentry Dashboard:** https://sentry.io/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard

### Documentation References

- Next.js 15 Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Resend Docs: https://resend.com/docs
- Sentry Next.js Setup: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Vercel Docs: https://vercel.com/docs

### Estimated Costs (Free Tier Usage)

- Supabase: $0/month (within free limits)
- Google OAuth: $0/month (free)
- Resend: $0/month (< 3K emails)
- Sentry: $0/month (< 5K events)
- Vercel: $0/month (hobby plan)
- **Total: $0/month** for local development

---

## Changelog

- **2026-01-07**: Initial PRD created
  - Scope: Local development environment setup
  - Services: Supabase, Google OAuth, Resend, Sentry, Vercel
  - Microsoft OAuth deferred to Phase 2
  - Success criteria defined: npm run dev + all services tested
