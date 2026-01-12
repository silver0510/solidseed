---
created: 2026-01-09T14:43:01Z
last_updated: 2026-01-12T01:29:05Z
version: 1.1
author: Claude Code PM System
---

# Technology Stack

## Core Technologies

### Next.js 16 (App Router with Turbopack)

- **Version**: 16.1.1 (latest stable)
- **Status**: ✅ Configured and running
- **Purpose**: Full-stack React framework
- **Key Features**:
  - App Router (server components, 60-70% bundle reduction)
  - Turbopack for development (faster builds)
  - Built-in API routes (no separate backend)
  - Image optimization and code splitting
  - TypeScript support
- **Bundle Size**: ~85KB (gzipped base)
- **Deployment**: Vercel

### Supabase (PostgreSQL)

- **Version**: Latest
- **Status**: ✅ Configured and operational
- **Project ID**: renpowxmbkprtwjklbcb
- **Purpose**: Managed PostgreSQL database and storage
- **Key Features**:
  - PostgreSQL database with 7 authentication tables
  - Supabase Studio for database management
  - Built-in connection pooling
  - Automatic backups
  - Storage bucket (client-documents with RLS policies)
- **Connection**: Via `SUPABASE_DATABASE_URL` environment variable
- **Client Library**: `lib/db.ts` (Supabase client configured)
- **ORM**: Prisma Client for type-safe database queries

### Prisma ORM

- **Version**: ^6.10.0
- **Status**: ✅ Integrated with Better Auth
- **Purpose**: Type-safe database access layer
- **Key Features**:
  - Type-safe database queries
  - Auto-generated TypeScript types
  - Database schema migrations
  - Introspection and validation
  - Better Auth adapter integration
- **Schema Location**: `prisma/schema.prisma`
- **Generated Client**: `generated/prisma` (project root)
- **Migrations**: 7 migrations created for authentication schema
  - `20260108040001_create_users_table.sql`
  - `20260108040002_create_oauth_providers_table.sql`
  - `20260108040003_create_password_resets_table.sql`
  - `20260108040004_create_email_verifications_table.sql`
  - `20260108040005_create_auth_logs_table.sql`
  - `20260108040006_create_verification_table.sql`
  - `20260108040007_create_sessions_table.sql`

### Better Auth

- **Version**: ^1.4.10
- **Status**: ✅ Integrated with Prisma adapter
- **Purpose**: Authentication framework
- **Key Features**:
  - OAuth 2.0 integration (Google configured, Microsoft pending)
  - Email/password authentication with verification
  - Email verification (24-hour token expiration)
  - JWT token generation and validation
  - Password hashing (bcrypt cost 12)
  - Rate limiting and account lockout (5 attempts → 30 min lock)
  - Session management (3-day default, 30-day with "remember me")
  - Trial period management (14 days from email verification)
- **Adapter**: Prisma adapter for type-safe database access
- **Configuration**: `lib/auth.ts` (main config)
- **Service Layer**: `services/auth.service.ts` (authentication logic)
- **API Routes**: `/api/auth/[...all]/route.ts` (Better Auth handler)
- **Frontend**: `lib/auth/client.ts` (client-side integration)

## Frontend Stack

### UI Framework

**Tailwind CSS v4**
- Utility-first CSS framework
- Mobile-first responsive design
- Custom breakpoints: xs (375px), sm (640px), md (768px), lg (1024px)
- Zero JavaScript runtime (CSS-only)
- Touch-friendly defaults (44x44px minimum tap targets)

**shadcn/ui**
- 45+ accessible components built on Radix UI
- Full TypeScript support
- Customizable with Tailwind
- Components copied into codebase (not npm packages)

**Bundle Size**: 0KB JavaScript (CSS-only)

### State Management

**TanStack Query v5**
- **Purpose**: Server state management (API data caching)
- **Features**: Auto-caching, retry logic, optimistic updates, suspense support
- **Bundle Size**: ~12KB
- **Use Cases**: Client data, documents, notes, tasks

**Zustand**
- **Purpose**: Client state management (UI state)
- **Features**: Simple API, no boilerplate, DevTools support
- **Bundle Size**: ~3KB
- **Use Cases**: Current user, auth tokens, UI flags

### Form Handling

**React Hook Form v7**
- 10x faster than Formik (dirty fields only)
- Minimal re-renders
- Bundle Size: ~45KB

**Zod v4.3.5**
- **Status**: ✅ Configured for environment validation and forms
- Type-safe validation with TypeScript
- Custom error messages
- Composable schemas
- **Use Cases**:
  - Environment variable validation (`lib/env.ts`)
  - Form validation (authentication forms, password strength)
  - API request/response validation
  - Password reset and change validation
- Bundle Size: ~5KB

**jsonwebtoken**
- **Version**: ^9.0.3
- **Status**: ✅ Integrated with Better Auth
- **Purpose**: JWT token generation and validation
- **Use Cases**:
  - Session token generation (login, OAuth)
  - Token validation middleware
  - Custom JWT payload (user_id, email, subscription_tier)
  - Token expiration management (3-day default, 30-day remember me)
- **Types**: @types/jsonwebtoken ^9.0.10

**Total Forms Bundle**: ~50KB

## Services & Tools

### Email Services

**Resend (Transactional Emails)**
- **Version**: 6.6.0
- **Status**: ✅ Configured and tested
- **Purpose**: System emails (verification, password reset)
- **Features**:
  - React Email for JSX-based templates
  - 3,000 emails/month free tier
  - 98%+ inbox rate (uses AWS SES)
- **Configuration**:
  - Helper library: `lib/email.ts` (EmailService class)
  - Test endpoint: `/api/test/email` (verified working)
  - Email templates: verification, password reset
  - From address: onboarding@resend.dev (development)

**Nylas (Marketing Emails - Phase 2)**
- OAuth-based Gmail/Outlook integration
- Sends from agent's actual email account
- Email tracking (opens, clicks, bounces)
- Thread and reply tracking
- **Pricing**: $15/mo base + $1.50/account

### Monitoring & Error Tracking

**Sentry**
- **Version**: @sentry/nextjs@10.32.1
- **Status**: ✅ Configured and tested
- **Purpose**: Error tracking and performance monitoring
- **Features**:
  - Error tracking with stack traces
  - Performance monitoring (slow API calls)
  - Session replay (user activity before errors)
  - User context tracking
- **Configuration**:
  - Instrumentation: `instrumentation.ts`
  - Server config: `sentry.server.config.ts`
  - Client config: `sentry.client.config.ts` (with session replay)
  - Edge config: `sentry.edge.config.ts`
  - Production-only error sending
  - Privacy filters (auth headers, cookies)
  - 10% trace sampling in production
- **Bundle Size**: ~8KB
- **Pricing**: Free (5K events/mo) → $26/mo (50K events)

**Health Check System**
- **Status**: ✅ Implemented
- **Endpoint**: `/api/health`
- **Features**:
  - Database connectivity check
  - Storage service check
  - Email service check
  - Sentry monitoring check
  - System metrics (uptime, memory)
  - Individual service latency tracking
- **Response Codes**:
  - 200: Healthy or degraded
  - 503: Unhealthy
- **Scripts**: `npm run health-check` or `./scripts/health-check.sh`

### Storage

**Supabase Storage**
- **Status**: ✅ Configured with RLS policies
- **Bucket**: `client-documents` (private)
- **Features**:
  - 1GB free storage
  - 2GB bandwidth/month free tier
  - CDN included (global edge caching)
  - Row-level security policies (4 policies active)
- **File Organization**: `{user-id}/{folder}/{filename}`
- **Helper Library**: `lib/storage.ts` (upload, delete, list, signed URLs)
- **Test Endpoint**: `/api/test/storage` (awaiting authentication)

### OAuth Providers

**Google OAuth 2.0**
- **Status**: ✅ Configured and operational
- GCP project created: "Korella CRM"
- OAuth consent screen configured (External user type)
- Scopes: email, profile, openid
- Client ID and secret stored in .env.local
- Redirect URI: `{APP_URL}/api/auth/callback/google`
- Integration: Better Auth with Prisma adapter
- Bug fix: Fixed user registration issue (2470a78 commit)

**Microsoft OAuth**
- **Status**: ⏳ Pending setup (next priority)
- Azure AD app registration required
- Scopes: email, profile, openid, User.Read
- Configuration ready in Better Auth (awaiting credentials)

### PWA Support

**next-pwa**
- **Status**: ✅ Configured in next.config.ts
- **Features**:
  - Service worker for offline viewing
  - "Add to home screen" functionality
  - Static asset caching
  - Background sync
  - Disabled in development mode
- **Manifest**: `/public/manifest.json`
- **Bundle Size**: ~2KB

### Testing

**Vitest**
- **Version**: 4.0.16
- **Status**: ✅ Configured with 63 tests passing
- **Purpose**: Unit and integration testing
- **Features**:
  - 50% faster than Jest (native ESM)
  - Jest-compatible API
  - Built-in TypeScript support
  - Component testing with React Testing Library
- **Test Files**: `tests/unit/**/*.test.ts`
- **Test Coverage**:
  - Session service: 28 tests
  - JWT utilities: 33 tests
  - Core authentication: 2 tests
  - **Total**: 63 tests passing
- **Coverage Target**: >80%

**Playwright**
- **Version**: 1.57.0
- **Status**: ✅ Configured for e2e testing
- **Purpose**: End-to-end testing
- **Features**:
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Mobile viewport emulation (test 375px screens)
  - Auto-wait (no flaky tests)
  - Visual regression testing
- **Test Files**: `tests/e2e/**/*.spec.ts`

### Development Tools

**Supabase CLI**
- **Status**: ✅ Installed and operational
- **Purpose**: Database migrations and management
- **Key Commands**:
  - `supabase migration new <name>` - Create migration
  - `supabase db push` - Apply migrations to remote
  - `supabase link` - Connect to remote project (completed)
- **Migrations**: 7 authentication migrations created and applied

**tsx**
- **Version**: ^4.21.0
- **Status**: ✅ Installed for running TypeScript scripts
- **Purpose**: Execute TypeScript files directly without compilation
- **Use Cases**:
  - Database management scripts
  - Test utilities
  - Seed data generation
- **Scripts Using tsx**:
  - `npm run db:test` - Test database connection
  - `npm run db:clear-auth` - Clear authentication data
  - `npm run db:seed-users` - Seed test users
  - `npm run db:reset-auth` - Reset authentication data

**Vercel CLI**
- **Status**: ✅ Configured
- **Purpose**: Deployment and preview environments
- **Configuration**: `vercel.json`
- **Documentation**: `DEPLOYMENT.md`

**CCPM (Claude Code Project Management)**
- **Location**: `.claude/` directory
- **Features**:
  - PRD creation and management
  - Epic decomposition
  - Task tracking
  - Context management

## Architecture Patterns

### Mobile-First Design

**Core Principle**: Design for mobile (375px+ width) first, enhance for desktop

**Rationale**: Real estate agents work primarily on mobile during showings, open houses, and client meetings

**Implications**:
- Touch-friendly UI (44x44px minimum touch targets)
- Simplified navigation for small screens
- Progressive enhancement for larger screens
- No horizontal scrolling on mobile
- Fast loading on cellular networks

### Data Management Patterns

**Soft Delete Pattern**
- Never hard delete records
- Use `is_deleted` boolean flag
- Enables data recovery and audit trails
- GDPR compliant with export

```sql
-- Soft delete example
UPDATE clients SET is_deleted = true, updated_at = NOW()
WHERE id = 'client-uuid';

-- Query only active records
SELECT * FROM clients WHERE is_deleted = false;
```

**Tag-Based Organization**
- Flexible, user-defined categorization
- Many-to-many relationship (clients ↔ tags)
- Enables multiple organizational schemes
- No rigid folder hierarchy

```sql
-- Tags table structure
CREATE TABLE client_tags (
  client_id UUID REFERENCES clients(id),
  tag_name VARCHAR(100),
  PRIMARY KEY (client_id, tag_name)
);
```

### Authentication Patterns

**Token-Based Authentication (JWT)**

**Flow**:
1. User authenticates → Server generates JWT
2. Client stores JWT (localStorage/sessionStorage)
3. Client sends JWT in Authorization header
4. Server validates JWT signature and expiration
5. Server extracts user_id and subscription_tier from token

**Token Structure**:
```javascript
{
  user_id: "uuid",
  email: "user@example.com",
  subscription_tier: "trial",
  iat: 1234567890,  // issued at
  exp: 1234827890   // expires (3 days default, 30 days with "remember me")
}
```

**Security Considerations**:
- Short-lived tokens (3 days default)
- HTTPS only (never over HTTP)
- No sensitive data in token payload

**OAuth Integration Pattern**

Server-side OAuth token exchange (not client-side):

```
1. Client: Click "Sign in with Google"
2. Server: Redirect to Google OAuth consent
3. User: Approve consent at Google
4. Google: Redirect to server callback with code
5. Server: Exchange code for access token (server-to-server)
6. Server: Fetch user profile from Google
7. Server: Create or find user in database
8. Server: Generate JWT token
9. Server: Redirect client to dashboard with JWT
```

**Benefits**:
- Client secret never exposed to browser
- Server controls user creation
- Can enrich user data before session creation

### Security Patterns

**Account Lockout Pattern**

```typescript
// On login failure
user.failed_login_count++
if (user.failed_login_count >= 5) {
  user.locked_until = now + 30 minutes
  sendSecurityEmail(user.email)
}

// On login success
user.failed_login_count = 0
user.locked_until = null
```

**Rate Limiting Pattern**

```
Login endpoint: 10 requests / minute / IP address
Password reset: 3 requests / hour / email address
```

**Audit Logging Pattern**

Events logged:
- Login success/failure
- Password reset request
- Email verification
- Account lockout
- OAuth authentication

Retention: 7 days in database (auto-purge)

### Trial Period Management

```typescript
// On email verification
user.trial_expires_at = now + 14 days
user.subscription_tier = "trial"

// On login (check expiration)
if (user.subscription_tier === "trial" &&
    user.trial_expires_at < now) {
  user.subscription_tier = "free"
}
```

**Business Logic**:
- Trial starts on email verification (not registration)
- 14 days from verification
- Auto-downgrade to free tier on expiration
- No credit card required

### Database Patterns

**UUID Primary Keys**

All tables use UUID v4 for primary keys (not auto-increment):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
);
```

**Rationale**:
- Prevents enumeration attacks
- Enables distributed systems
- No collision risk across databases
- Better for public APIs

**Timestamp Pattern**

Every table has `created_at` and `updated_at`:

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Composite Unique Constraints**

```sql
-- OAuth providers: one provider per user per platform
CREATE UNIQUE INDEX oauth_providers_unique
ON oauth_providers(user_id, provider);

-- Client tags: one tag per client (no duplicates)
CREATE UNIQUE INDEX client_tags_unique
ON client_tags(client_id, tag_name);
```

### API Design (Planned)

**RESTful Endpoints**

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/oauth/google
GET    /api/auth/oauth/google/callback
GET    /api/auth/oauth/microsoft
GET    /api/auth/oauth/microsoft/callback

GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id  (soft delete)
GET    /api/clients/:id/documents
POST   /api/clients/:id/documents
```

**Response Format**

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Error Categories**:
- `VALIDATION_ERROR` - Invalid input
- `AUTH_ERROR` - Authentication failure
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT` - Too many requests
- `SERVER_ERROR` - Internal server error

## Directory Structure

```
korella/
├── .claude/                      # Project management (CCPM)
│   ├── commands/                 # Slash commands
│   ├── context/                  # Context files (5 total)
│   ├── epics/                    # Technical plans (2 complete)
│   ├── prds/                     # Product requirements (2 total)
│   └── rules/                    # Development guidelines
├── app/                          # Next.js App Router (root-level)
│   ├── (auth)/                   # Auth route group (public) ✅
│   │   ├── login/page.tsx        # Login page ✅
│   │   ├── register/page.tsx     # Registration page ✅
│   │   ├── verify-email/page.tsx # Email verification ✅
│   │   ├── forgot-password/page.tsx # Password reset request ✅
│   │   ├── reset-password/page.tsx # Password reset completion ✅
│   │   └── layout.tsx            # Auth layout ✅
│   ├── (dashboard)/              # Dashboard route group (pending)
│   │   ├── clients/              # Client management (pending)
│   │   ├── documents/            # Document management (pending)
│   │   ├── settings/             # User settings (pending)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...all]/route.ts    # Better Auth handler ✅
│   │   │   ├── me/route.ts          # Current user profile ✅
│   │   │   ├── verify-email/route.ts # Email verification ✅
│   │   │   ├── forgot-password/route.ts # Password reset request ✅
│   │   │   ├── reset-password/route.ts # Password reset completion ✅
│   │   │   ├── change-password/route.ts # Password change ✅
│   │   │   └── logout/route.ts      # Logout ✅
│   │   ├── health/route.ts       # Health check endpoint ✅
│   │   └── test/                 # Test endpoints ✅
│   ├── global-error.tsx          # Sentry error handler ✅
│   ├── layout.tsx                # Root layout ✅
│   └── page.tsx                  # Home page ✅
├── components/
│   ├── auth/                     # Authentication components ✅
│   │   ├── SocialLoginButton.tsx
│   │   ├── PasswordStrengthIndicator.tsx
│   │   ├── FormInput.tsx
│   │   └── Button.tsx
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Reusable form components
│   └── layouts/                  # Layout components
├── lib/
│   ├── db.ts                     # Supabase client ✅
│   ├── storage.ts                # Storage helper ✅
│   ├── email.ts                  # Email service ✅
│   ├── env.ts                    # Environment validation ✅
│   ├── validate-env.ts           # Env validation middleware ✅
│   ├── auth.ts                   # Better Auth config ✅
│   ├── auth/
│   │   ├── client.ts             # Client-side auth utilities ✅
│   │   └── api.ts                # Auth API client ✅
│   ├── password-validation.ts    # Password strength checker ✅
│   └── utils.ts                  # Utility functions ✅
├── services/
│   ├── auth.service.ts           # Authentication logic ✅
│   └── email.service.ts          # Email sending service ✅
├── prisma/
│   ├── schema.prisma             # Prisma schema ✅
│   └── migrations/               # Database migrations (7 total) ✅
├── generated/
│   └── prisma/                   # Generated Prisma Client ✅
├── supabase/
│   ├── .temp/                    # CLI temp files
│   └── migrations/               # Supabase SQL migrations ✅
├── tests/
│   ├── e2e/                      # Playwright tests ✅
│   └── unit/                     # Vitest tests (63 passing) ✅
├── public/
│   ├── manifest.json             # PWA manifest ✅
│   └── icons/
├── scripts/
│   ├── health-check.sh           # Health monitoring ✅
│   ├── test-db-connection.ts     # Database connection test ✅
│   ├── test-connection-string.sh # Connection string test ✅
│   ├── clear-auth-data.ts        # Clear auth data (TypeScript) ✅
│   ├── clear-auth-data.sh        # Clear auth data (Bash) ✅
│   ├── seed-test-users.ts        # Seed test users ✅
│   ├── reset-auth-data.ts        # Reset auth data ✅
│   └── README.md                 # Scripts documentation ✅
├── instrumentation.ts            # Sentry instrumentation ✅
├── sentry.server.config.ts       # Sentry configs ✅
├── sentry.client.config.ts
├── sentry.edge.config.ts
├── next.config.ts                # Next.js + PWA config ✅
├── tailwind.config.ts            # Tailwind config ✅
├── tsconfig.json                 # TypeScript config ✅
├── vitest.config.ts              # Vitest config ✅
├── playwright.config.ts          # Playwright config ✅
├── vercel.json                   # Vercel deployment ✅
├── .env.local                    # Environment variables ✅
├── .env.example                  # Env template ✅
├── package.json                  # Dependencies (updated) ✅
├── CLAUDE.md                     # Developer guide ✅
├── DEPLOYMENT.md                 # Deployment checklist ✅
└── LOCAL_MODE.md                 # Local workflow guide ✅
```

**File Organization Principles**:

- **Route Groups**: `(auth)` and `(dashboard)` don't affect URLs but allow different layouts
- **Feature Modules**: Each feature in `features/` has components, hooks, services, types
- **Colocation**: Keep related code together for easy feature extraction

## Database Schema

### Authentication Tables (7 tables via Prisma)

1. **users** - User accounts with subscription tiers
   - Fields: id, name, email, emailVerified, image, subscription_tier, trial_expires_at, failed_login_count, locked_until, is_deleted, createdAt, updatedAt
   - Managed by Better Auth + Prisma

2. **accounts** - OAuth provider accounts
   - Fields: id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token
   - Managed by Better Auth (OAuth connections)

3. **sessions** - User sessions with JWT
   - Fields: id, userId, sessionToken, expiresAt, ipAddress, userAgent
   - 3-day default expiration, 30-day with "remember me"

4. **verification_tokens** - Email verification tokens
   - Fields: identifier, token, expires
   - 24-hour expiration, auto-purged after use

5. **password_resets** - Password reset tokens
   - Fields: id, user_id, token, expires_at, used, created_at
   - 1-hour expiration, single-use tokens

6. **oauth_providers** - OAuth provider metadata (legacy)
   - Fields: id, user_id, provider, provider_user_id, created_at
   - Supplementary to accounts table

7. **auth_logs** - Security audit trail
   - Fields: id, user_id, event_type, ip_address, user_agent, created_at
   - 7-day retention, auto-purged via cron job

### Client Hub Tables (5 tables)

1. **clients** - Client profiles
   - Fields: id, user_id, name, email, phone, address, status, is_deleted, created_at, updated_at

2. **client_tags** - Tag-based organization
   - Fields: client_id, tag_name (composite primary key)

3. **client_documents** - Document storage
   - Fields: id, client_id, file_name, file_size, file_type, storage_path, description, uploaded_at, is_deleted

4. **client_notes** - Activity notes
   - Fields: id, client_id, note_text, created_at

5. **client_tasks** - Task management
   - Fields: id, client_id, task_text, due_date, priority, is_completed, created_at, updated_at

**Total**: 12 tables for MVP (7 authentication ✅, 5 client hub pending)

## Environment Variables

**Core Variables (Required)**:

```bash
# Application
NODE_ENV=development
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=minimum-32-characters-long-random-string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# OAuth - Google
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# OAuth - Microsoft (pending)
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx

# Email (Transactional)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# Monitoring (optional)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Validation**:
- ✅ Zod schema validation in `lib/env.ts`
- ✅ Type-safe access throughout codebase
- ✅ Startup validation via `instrumentation.ts`
- Scripts: `npm run validate-env`, `npm run type-check`

## Integration Requirements

### Supabase Setup

1. Create account at https://app.supabase.com (free tier)
2. Create new project and note reference ID
3. Copy connection credentials to `.env.local`
4. Install CLI: `npm install -g supabase`
5. Initialize: `supabase init` (✅ completed)
6. Link: `supabase link --project-ref your-ref-id` (✅ completed)

### OAuth Setup

**Google Cloud Platform**:
1. Create project at https://console.cloud.google.com (✅ completed)
2. Enable Google+ API
3. Create OAuth 2.0 Client ID (✅ completed)
4. Configure consent screen (✅ completed)
5. Add redirect URIs for all environments

**Microsoft Azure AD**:
1. Register application at https://portal.azure.com
2. Configure redirect URIs
3. Add API permissions (email, profile)
4. Generate client secret
5. Grant admin consent

## Performance Targets

**Response Times**:
- Login: <2 seconds
- Registration: <3 seconds
- OAuth flow: <5 seconds end-to-end
- API endpoints: <500ms average
- Database queries: <100ms average
- Page load: <3 seconds

**Bundle Sizes**:
- Main bundle: ~185KB gzipped
- Per-page: <50KB additional
- Total JavaScript: <250KB

**Scalability**:
- Support 100+ concurrent logins
- Handle 1,000+ active users
- Maintain performance with 10,000+ client records per user

**Availability**:
- 99.9% uptime target
- Supabase SLA: 99.9%

## Cost Analysis

### MVP (10 users)
- Vercel: Free
- Supabase: Free (500MB DB, 1GB storage)
- Resend: Free (3K emails/mo)
- Sentry: Free (5K events/mo)
- **Total**: $0/month

### Growth (100 users)
- Vercel: Free (100GB bandwidth)
- Supabase Pro: $25/mo
- Resend: $20/mo (50K emails)
- Sentry: $26/mo (50K events)
- **Total**: $71/month

### Scale (1,000 users)
- Vercel Pro: $20/mo
- Supabase Pro: $25/mo
- Resend: $20/mo
- Sentry: $26/mo
- **Total**: $91/month

**Revenue vs Cost** (at $49/mo subscription):
- 100 users: $4,900 revenue - $71 costs = **$4,829 profit (98% margin)**
- 1,000 users: $49,000 revenue - $91 costs = **$48,909 profit (99% margin)**

## Notes

- Infrastructure setup ✅ Complete
- User Authentication epic ✅ Complete (10 tasks, 63 tests passing)
- Database migrations ✅ Complete (7 Prisma migrations applied)
- Better Auth integration ✅ Complete (Prisma adapter)
- Frontend UI ✅ Complete (5 auth pages, 7+ components)
- Google OAuth ✅ Operational (Microsoft pending)
- Total bundle size optimized for mobile: ~185KB
- All services have generous free tiers for MVP validation
- Next major feature: Client Hub (PRD ready, needs epic decomposition)
- Branch: epic/user-authentication (ready to merge to main)
