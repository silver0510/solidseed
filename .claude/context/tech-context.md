---
created: 2026-01-06T09:03:33Z
last_updated: 2026-01-07T15:02:25Z
version: 2.1
author: Claude Code PM System
---

# Technical Context

## Technology Stack

### Current Status: Infrastructure Setup - Implementation Started

The project has transitioned from planning to implementation. Core infrastructure is being set up with Next.js 16, Supabase, and testing frameworks configured. Application code structure is established and basic integrations are functional.

### Database & Backend

**Supabase (PostgreSQL)**

- **Version**: Latest (project created: renpowxmbkprtwjklbcb)
- **Status**: ✅ Configured and tested
- **Purpose**: Managed PostgreSQL database hosting
- **Features Used**:
  - PostgreSQL database (migrations pending)
  - Supabase Studio for database management
  - Built-in connection pooling (active)
  - Automatic backups
  - Supabase CLI initialized locally
  - Storage bucket created (client-documents)
- **Migration Path**: `supabase/migrations/` directory
- **Connection**: Via `SUPABASE_DATABASE_URL` environment variable
- **Client Library**: `lib/db.ts` (Supabase client configured)

**Database Schema (Planned):**

_Authentication Tables (5):_

1. `users` - User accounts with subscription tiers
2. `oauth_providers` - Social login mappings
3. `password_resets` - Password reset tokens
4. `email_verifications` - Email verification tokens
5. `auth_logs` - Security audit trail

_Client Hub Tables (5):_

1. `clients` - Client profiles
2. `client_tags` - Tag-based organization
3. `client_documents` - Document storage
4. `client_notes` - Activity notes
5. `client_tasks` - Task management

_Email Marketing Tables (4) - Phase 2:_

1. `email_campaigns` - Campaign management
2. `campaign_recipients` - Recipient tracking
3. `campaign_stats` - Aggregated analytics
4. `email_connections` - Gmail/Outlook OAuth grants

**Total:** 14 tables (10 for MVP, 4 for email marketing feature)

### Authentication

**Better Auth Library**

- **Purpose**: Authentication framework
- **Features**:
  - OAuth 2.0 integration (Google, Microsoft)
  - Email/password authentication
  - Email verification (24-hour tokens)
  - JWT token generation and validation
  - Password hashing (bcrypt cost 12)
  - Rate limiting
  - Account lockout protection
- **Adapter**: Supabase PostgreSQL adapter
- **Configuration**: `config/better-auth.config.ts` (to be created)

**OAuth Providers:**

- **Google OAuth 2.0**
  - Google Cloud Platform project required
  - Scopes: email, profile
  - Client ID and secret in environment variables
- **Microsoft OAuth**
  - Azure AD app registration required
  - Scopes: email, profile, openid, User.Read
  - Client ID and secret in environment variables

### Security

**Password Security:**

- Bcrypt hashing with cost factor 12
- Complexity requirements: 8+ chars, uppercase, lowercase, number, symbol
- Account lockout: 5 failed attempts → 30-minute lock
- Security audit logging (7-day retention)

**Session Management:**

- JWT tokens (HS256 algorithm)
- 3-day default expiration
- 30-day expiration with "remember me"
- Subscription tier stored in token

**Rate Limiting:**

- Login: 10 attempts per minute per IP
- Password reset: 3 requests per hour per email
- Email verification: TBD

**Security Headers (Planned):**

- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Content-Security-Policy
- X-XSS-Protection

### Storage

**Supabase Storage**

- **Status**: ✅ Configured with RLS policies
- **Bucket**: `client-documents` (private)
- **Purpose**: Client document storage (PDFs, images, contracts)
- **Features**:
  - 1GB free storage
  - 2GB bandwidth/month free tier
  - CDN included (global edge caching)
  - Row-level security policies (4 policies active)
  - Upload progress tracking SDK
- **File Organization**: `{user-id}/{folder}/{filename}`
- **Supported Formats**: All common document types (50MB limit)
- **Helper Library**: `lib/storage.ts` (upload, delete, list, signed URLs)
- **Test Endpoint**: `/api/test/storage` (awaiting authentication)

### Frontend Framework

**Next.js 16 (App Router with Turbopack)**

- **Version**: 16.1.1 (latest stable)
- **Status**: ✅ Configured and running
- **Purpose**: Full-stack React framework
- **Features Used**:
  - App Router (not Pages Router)
  - Turbopack for development (faster builds)
  - Server Components (60-70% bundle reduction)
  - Built-in API routes (no separate backend)
  - Image optimization
  - Automatic code splitting
  - TypeScript support
- **Configuration**: `next.config.ts` with PWA support
- **Bundle Size**: ~85KB (gzipped base)
- **Deployment**: Vercel (planned)

### UI Framework

**Tailwind CSS v4 + shadcn/ui**

- **Tailwind CSS**: Utility-first CSS framework
  - Mobile-first responsive design
  - Custom breakpoints: xs (375px), sm (640px), md (768px), lg (1024px)
  - Zero JavaScript runtime (CSS-only)
  - Touch-friendly defaults (44x44px minimum tap targets)
- **shadcn/ui**: Accessible component library
  - 45+ production-ready components
  - Built on Radix UI primitives
  - Full TypeScript support
  - Customizable with Tailwind
- **Bundle Size**: 0KB JavaScript (CSS-only)

### State Management

**TanStack Query v5 + Zustand**

- **TanStack Query**: Server state management
  - **Purpose**: API data caching, refetching, synchronization
  - **Features**: Auto-caching, retry logic, optimistic updates, suspense support
  - **Bundle Size**: ~12KB
  - **Use Cases**: Client data, documents, notes, tasks
- **Zustand**: Client state management
  - **Purpose**: UI state, auth state, app settings
  - **Features**: Simple API, no boilerplate, DevTools support
  - **Bundle Size**: ~3KB
  - **Use Cases**: Current user, auth tokens, UI flags

### Form Handling

**React Hook Form v7 + Zod**

- **React Hook Form**: Form state and validation
  - 10x faster than Formik (dirty fields only)
  - Minimal re-renders
  - Perfect for authentication forms
  - Bundle Size: ~45KB
- **Zod**: TypeScript schema validation
  - Type-safe validation
  - Custom error messages
  - Composable schemas
  - Bundle Size: ~5KB
- **Total Bundle**: ~50KB

### Development Tools

**CCPM (Claude Code Project Management)**

- **Version**: Custom implementation
- **Purpose**: Project management system
- **Location**: `.claude/` directory
- **Features**:
  - PRD creation and management
  - Epic decomposition
  - Task tracking
  - GitHub sync (optional)
  - Local-only mode support
  - Context management

**Supabase CLI**

- **Status**: ✅ Installed and initialized
- **Installation**: `npm install -g supabase`
- **Purpose**: Database migrations and management
- **Project**: Linked to remote Supabase project
- **Commands**:
  - `supabase init` - Initialize project (completed)
  - `supabase migration new <name>` - Create migration
  - `supabase db push` - Apply migrations
  - `supabase link` - Connect to remote project (completed)

**Skills Automation:**

- Better Auth initialization (Python scripts)
- Tailwind configuration generation
- shadcn/ui component addition
- Test infrastructure

### Email Services

**Resend (Transactional Emails)**

- **Purpose**: System emails (verification, password reset, notifications)
- **Features**:
  - React Email for JSX-based templates
  - 3,000 emails/month free tier
  - 98%+ inbox rate (uses AWS SES)
  - Clean modern API
- **Pricing**: Free → $20/mo (50K emails) → pay-as-you-go
- **Use Cases**:
  - Email verification links
  - Password reset links
  - System notifications
  - Welcome emails

**Nylas (Marketing Emails - Phase 2)**

- **Purpose**: Gmail/Outlook integration for bulk email campaigns
- **Features**:
  - OAuth-based connection (no DNS configuration)
  - Sends from agent's actual Gmail/Outlook account
  - Email tracking (opens, clicks, bounces)
  - Thread and reply tracking
  - Calendar integration (bonus feature)
- **Pricing**:
  - Full Platform: $15/mo base (includes first 5 accounts)
  - Additional accounts: $1.50/account/mo
  - Example: 100 agents = $157.50/mo
- **Use Cases**:
  - Bulk email campaigns to clients
  - Scheduled marketing emails
  - Automated follow-up sequences
  - Personalized agent-to-client communications

### Job Queue & Workflows

**Inngest (Phase 2 - Email Marketing)**

- **Purpose**: Serverless job queue and workflow automation
- **Features**:
  - Scheduled execution (cron, delays, specific datetime)
  - Conditional workflows (if-then logic)
  - Visual workflow builder
  - No Redis required
  - Vercel integration
- **Pricing**: Free (50K steps/mo) → $25/mo (250K steps)
- **Use Cases**:
  - Scheduled email campaigns
  - Birthday email automation
  - Follow-up sequences
  - Drip campaigns
  - Event-triggered workflows

### Testing

**Vitest**

- **Version**: 4.0.16
- **Status**: ✅ Configured with jsdom
- **Purpose**: Unit and integration testing
- **Features**:
  - 50% faster than Jest (native ESM)
  - Jest-compatible API
  - Built-in TypeScript support
  - Component testing with React Testing Library
- **Configuration**: `vitest.config.ts`
- **Test Files**: `tests/unit/**/*.test.ts`
- **Coverage Target**: >80%
- **Bundle Size**: 0KB (development only)

**Playwright**

- **Version**: 1.57.0
- **Status**: ✅ Configured for e2e testing
- **Purpose**: End-to-end testing
- **Features**:
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Mobile viewport emulation (test 375px screens)
  - Auto-wait (no flaky tests)
  - Visual regression testing
  - API testing
- **Configuration**: `playwright.config.ts`
- **Test Files**: `tests/e2e/**/*.spec.ts`
- **Use Cases**:
  - Complete user flows (registration, login, OAuth)
  - Mobile responsiveness
  - Cross-browser compatibility

**Test Types:**

1. Unit tests (Vitest) - auth logic, business rules
2. Integration tests (Vitest) - API endpoints, database operations
3. E2E tests (Playwright) - critical user flows
4. Performance testing - login <2s, page load <3s
5. Security testing - OWASP checklist
6. Mobile responsiveness - 375px+ screens

**Additional Test Dependencies:**

- `@testing-library/react` 16.3.1
- `@testing-library/jest-dom` 6.9.1
- `@testing-library/user-event` 14.6.1

### Monitoring & Error Tracking

**Sentry**

- **Purpose**: Error tracking and performance monitoring
- **Features**:
  - Error tracking with stack traces
  - Performance monitoring (slow API calls)
  - Session replay (user activity before errors)
  - User context tracking
  - One-line Next.js integration
- **Pricing**: Free (5K events/mo) → $26/mo (50K events)
- **Bundle Size**: ~8KB
- **Metrics Tracked**:
  - Error rates and types
  - API response times
  - User session data
  - Frontend performance

### Additional Tools

**next-pwa (Progressive Web App)**

- **Version**: Latest
- **Status**: ✅ Configured in next.config.ts
- **Purpose**: Offline capability and mobile app experience
- **Features**:
  - Service worker for offline viewing
  - "Add to home screen" functionality
  - Static asset caching (generated in /public)
  - Background sync
  - Disabled in development mode
- **Configuration**: Integrated with Next.js config
- **Manifest**: `/public/manifest.json` (configured)
- **Bundle Size**: ~2KB

**date-fns**

- **Purpose**: Date/time manipulation and formatting
- **Features**:
  - Tree-shakable (only import needed functions)
  - ISO 8601 support (matches datetime standards)
  - Timezone support
  - Simple, functional API
- **Bundle Size**: ~7KB (only imported functions)

**Native Fetch API**

- **Purpose**: HTTP client for API calls
- **Features**:
  - Zero dependencies (built into browsers and Node.js)
  - Custom wrapper for JWT token injection
  - TypeScript support
  - Streaming support
- **Bundle Size**: 0KB

### Deployment

**Hosting: Vercel (Recommended)**

- **Why Vercel**:
  - Built by Next.js creators
  - Zero-config deployment
  - Automatic HTTPS
  - Global CDN
  - Preview deployments for PRs
  - Environment variables management
- **Free Tier**:
  - Unlimited personal projects
  - 100GB bandwidth/mo
  - Serverless functions included
  - No credit card required

**Environments:**

- Development: `http://localhost:3000`
- Staging: `https://korella-staging.vercel.app`
- Production: `https://app.korella.com`

**Infrastructure:**

- **Frontend**: Vercel
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage
- **Email (transactional)**: Resend
- **Email (marketing)**: Nylas (Phase 2)
- **Jobs**: Inngest (Phase 2)
- **Monitoring**: Sentry
- **SSL**: Automatic (Vercel + Supabase)
- **Domain**: Custom domain configuration required

### Environment Variables

**Required for MVP (Phase 1):**

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Better Auth
BETTER_AUTH_SECRET=your-32-char-secret
BETTER_AUTH_URL=http://localhost:3000

# OAuth - Google
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx

# Email (Transactional)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Additional for Phase 2 (Email Marketing):**

```bash
# Nylas Email Integration
NYLAS_API_KEY=nyk_xxxxxxxxxxxx
NYLAS_API_URI=https://api.us.nylas.com

# Inngest Job Queue
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

**Not Set Up Yet:**

- Supabase project doesn't exist
- OAuth applications not registered
- Better Auth secret not generated
- Resend account not created
- Sentry project not created
- No `.env.local` file created

### Dependencies

**Core Dependencies (Phase 1):**

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-auth": "^2.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0",
    "resend": "^3.0.0",
    "react-email": "^2.0.0",
    "date-fns": "^3.0.0",
    "next-pwa": "^5.0.0",
    "@sentry/nextjs": "^8.0.0"
  }
}
```

**Additional Dependencies (Phase 2 - Email Marketing):**

```json
{
  "dependencies": {
    "nylas": "^7.0.0",
    "inngest": "^3.0.0"
  }
}
```

**Development Dependencies:**

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.0.0",
    "supabase": "^1.0.0"
  }
}
```

**Total Bundle Size (Production):**

- Next.js base: ~85KB
- React: included
- State management: ~15KB (TanStack + Zustand)
- Forms: ~50KB (React Hook Form + Zod)
- Better Auth: ~18KB
- Monitoring: ~8KB (Sentry)
- PWA: ~2KB
- Date: ~7KB (date-fns)
- **Total: ~185KB gzipped**

**Not Installed Yet:**

- No `package.json` exists
- No dependencies installed
- Need to run `npm create next-app@latest` to initialize

### Data Flow (Planned Architecture)

**Registration Flow:**

1. User submits registration form
2. Frontend validates input
3. API endpoint creates user (pending_verification status)
4. Email verification token generated
5. Verification email sent
6. User clicks email link
7. Account activated, trial period starts (14 days)

**Login Flow:**

1. User submits credentials
2. Backend validates against database
3. Check account status (active, locked, etc.)
4. Check trial expiration (downgrade if needed)
5. Generate JWT with subscription tier
6. Return token to frontend
7. Frontend stores token, redirects to dashboard

**OAuth Flow:**

1. User clicks "Sign in with Google/Microsoft"
2. Redirect to OAuth provider
3. User approves consent
4. Provider redirects with authorization code
5. Backend exchanges code for tokens
6. Fetch user profile from provider
7. Create or update user account
8. Generate JWT token
9. Redirect to dashboard

## Integration Requirements

### Supabase Setup

**Prerequisites:**

1. Supabase account (free tier available)
2. Create project at https://app.supabase.com
3. Note project reference ID
4. Copy connection credentials

**Initial Setup:**

```bash
# Install CLI
npm install -g supabase

# Initialize locally
supabase init

# Link to remote project
supabase link --project-ref your-ref-id
```

### OAuth Provider Setup

**Google Cloud Platform:**

1. Create project
2. Enable Google+ API
3. Create OAuth 2.0 Client ID
4. Configure consent screen
5. Add redirect URIs for all environments

**Microsoft Azure AD:**

1. Register application
2. Configure redirect URIs
3. Add API permissions (email, profile)
4. Generate client secret
5. Grant admin consent

### Project Structure

**Recommended Directory Structure:**

```
korella-crm/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, register)
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── (dashboard)/              # Protected routes
│   │   ├── clients/
│   │   ├── documents/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...all]/       # Better Auth handler
│   │   ├── clients/
│   │   └── documents/
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Reusable form components
│   └── layouts/                  # Layout components
├── lib/
│   ├── auth.ts                   # Better Auth config
│   ├── db.ts                     # Supabase client
│   ├── api-client.ts             # Fetch wrapper
│   └── utils.ts
├── features/
│   ├── auth/                     # Auth feature module
│   ├── clients/                  # Client management
│   └── documents/                # Document management
├── supabase/migrations/          # Database migrations
├── tests/
│   ├── unit/                     # Vitest tests
│   └── e2e/                      # Playwright tests
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   └── icons/
├── .claude/                      # CCPM project management
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

## Development Workflow

**Current Workflow:**

1. Create PRDs using `/pm:prd-new`
2. Convert to epics using `/pm:prd-parse`
3. Decompose to tasks using `/pm:epic-decompose`
4. Track progress locally or sync to GitHub

**Future Development Workflow:**

1. Select task from epic
2. Create feature branch
3. Implement code
4. Write tests
5. Run test suite
6. Create pull request
7. Code review
8. Merge to main

## Monitoring & Analytics

**Error Tracking: Sentry**

- Runtime errors with stack traces
- Frontend and API errors
- User context (user ID, session)
- Error grouping and deduplication
- Release tracking
- Source maps for debugging

**Performance Monitoring: Sentry Performance**

- API endpoint response times
- Database query performance
- Frontend page load times
- Web Vitals (LCP, FID, CLS)
- User flow tracking

**Application Metrics to Track:**

- Registration conversion rate
- Login success vs failure rate
- OAuth vs email/password split
- Password reset requests
- Account lockout events
- API response times (p50, p95, p99)
- Error rates by endpoint
- User session duration
- Feature usage statistics

**Security Monitoring:**

- Failed login attempts (via auth_logs table)
- Account lockout events
- Password reset frequency
- Suspicious IP patterns
- Rate limit violations
- OAuth failures

**Database Monitoring: Supabase Dashboard**

- Query performance
- Connection pooling stats
- Database size and growth
- Table sizes
- Index usage

## Performance Targets

**Response Times:**

- Login: <2 seconds
- Registration: <3 seconds
- OAuth flow: <5 seconds end-to-end
- API endpoints: <500ms average

**Scalability:**

- Support 100+ concurrent logins
- Handle 1000+ active users
- Maintain performance with 10,000+ client records per user

**Availability:**

- 99.9% uptime target
- Supabase SLA: 99.9%
- OAuth provider dependency managed

## Cost Analysis

### MVP Testing (10 agents)

- **Vercel**: Free (unlimited personal projects)
- **Supabase**: Free (500MB DB, 50K MAU, 1GB storage)
- **Resend**: Free (3K emails/mo)
- **Nylas**: $22.50/mo ($15 base + 5 accounts × $1.50)
- **Inngest**: Free (50K steps/mo)
- **Sentry**: Free (5K events/mo)
- **Total**: ~$22.50/month

### Growth Phase (50 agents)

- **Vercel**: Free (still within limits)
- **Supabase**: Free or $25/mo (depends on usage)
- **Resend**: Free (3K emails/mo)
- **Nylas**: $82.50/mo ($15 base + 45 accounts × $1.50)
- **Inngest**: $25/mo (250K steps)
- **Sentry**: $26/mo (50K events)
- **Total**: ~$158.50/month

### Scale Phase (100 agents)

- **Vercel**: Free (100GB bandwidth)
- **Supabase Pro**: $25/mo (>50K API requests)
- **Resend**: $20/mo (50K emails)
- **Nylas**: $157.50/mo ($15 base + 95 accounts × $1.50)
- **Inngest**: $25/mo (250K steps)
- **Sentry**: $26/mo (50K events)
- **Total**: ~$253.50/month

### Large Scale (500 agents)

- **Vercel Pro**: $20/mo (may need for bandwidth)
- **Supabase Pro**: $25/mo
- **Resend**: $20/mo
- **Nylas**: $757.50/mo ($15 base + 495 accounts × $1.50)
- **Inngest**: $50/mo (500K steps)
- **Sentry**: $26/mo
- **Total**: ~$898.50/month

### Revenue vs Cost (at $49/mo subscription)

- **50 agents**: $2,450 revenue - $158.50 costs = **$2,291.50 profit (94% margin)**
- **100 agents**: $4,900 revenue - $253.50 costs = **$4,646.50 profit (95% margin)**
- **500 agents**: $24,500 revenue - $898.50 costs = **$23,601.50 profit (96% margin)**

**Key Insight**: Costs scale linearly and remain only 4-6% of revenue, leaving excellent profit margins.

## Notes

- Tech stack finalized and documented
- No code written yet - ready to begin implementation
- Supabase project must be created as first step
- OAuth applications must be registered before testing
- Resend account needed for email verification
- All services have generous free tiers for MVP validation
- Total JavaScript bundle: ~185KB (excellent for mobile)
- Expected page load: <3s on 4G networks
- Expected login time: <2s
- Mobile-first design with 375px minimum width
- Progressive Web App capabilities included
