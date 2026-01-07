---
created: 2026-01-06T09:03:33Z
last_updated: 2026-01-06T09:03:33Z
version: 1.0
author: Claude Code PM System
---

# Project Overview

## What is Korella?

Korella is a **mobile-first CRM platform for real estate professionals** that enables agents, brokers, and loan officers to manage client relationships, documents, and communications in one centralized system - with complete data ownership and portability.

### Elevator Pitch

"Korella is FollowUpBoss reimagined for mobile - half the price, with data you actually own. Built specifically for independent real estate agents who need their client data accessible anywhere, anytime."

## Core Features

### 1. User Authentication (In Planning)

**Purpose**: Secure access control with multiple login options.

**Capabilities:**

- Email/password registration with verification
- Google OAuth ("Sign in with Google")
- Microsoft OAuth ("Sign in with Microsoft")
- Password reset via email link
- Account security (lockout after failed attempts)
- 14-day free trial automatically starting on verification
- Session management with JWT tokens

**Status**: Epic decomposed into 10 implementation tasks

**Key Technical Details:**

- Better Auth library for authentication framework
- Bcrypt password hashing (cost factor 12)
- JWT tokens (3-day default, 30-day with "remember me")
- Rate limiting (10 login attempts/min per IP)
- Email verification required before account activation

### 2. Client Hub (In Planning)

**Purpose**: Centralized client management and relationship tracking.

**Capabilities:**

**Client Profiles:**

- Full name, email, phone, address
- Custom notes and activity history
- Important dates tracking
- Profile status (active, archived)
- Soft delete (data recovery possible)

**Tag-Based Organization:**

- Create custom tags ("Buyer", "Seller", "Open House 2026-01", etc.)
- Apply multiple tags per client
- Filter and search by tags
- Flexible categorization without rigid folders

**Document Management:**

- Upload documents (contracts, disclosures, photos)
- File size and type tracking
- Chronological organization (sorted by upload date)
- Optional descriptions for context
- Secure storage via Supabase
- Soft delete for accidental removal recovery

**Notes & Activity Tracking:**

- Timestamped notes for all interactions
- Search through historical notes
- Quick context before client meetings
- Track phone calls, meetings, property showings

**Task Management:**

- Create tasks with due dates
- Set priorities (low, medium, high)
- Mark tasks complete
- Link tasks to specific clients
- Follow-up reminders

**Search & Filtering:**

- Search by client name, email, phone
- Filter by tags
- Filter by date ranges
- Sort by last modified, created date, name

**Status**: PRD complete, epic decomposition pending

**Key Technical Details:**

- 5 database tables (clients, tags, documents, notes, tasks)
- Tag-based organization (many-to-many relationship)
- Document categories removed (simplified to chronological)
- Soft delete on all entities
- GDPR compliant (data export capability)

### 3. Email Marketing (Future - Phase 2)

**Purpose**: Targeted communication campaigns to client segments.

**Planned Capabilities:**

- Send campaigns to clients filtered by tags
- Email templates
- Open and click tracking
- Automated follow-up sequences
- Unsubscribe management
- Campaign analytics

**Status**: Vision only, no PRD yet

**Integration Point**: Will use Client Hub tags for segmentation

## Platform Capabilities

### Mobile-First Design

**Design Principle**: Optimized for 375px+ width screens (iPhone SE and up).

**Why Mobile-First:**

- Real estate agents work on-the-go during showings
- Quick client lookup needed during property visits
- Document access required in the field
- Task creation on-site at open houses

**Desktop Experience:**

- Enhanced version with larger screens
- More data visible at once
- Easier bulk operations
- Desktop is secondary, not primary

### Data Ownership & Portability

**Unique Value**: Agents own their data, not the brokerage.

**Benefits:**

- Take client data when switching brokerages
- Export data in standard formats
- No vendor lock-in
- GDPR compliant with export rights

**Implementation:**

- Data export endpoint (CSV, JSON)
- Account deletion with data download
- Clear data ownership terms

### Self-Service Onboarding

**No sales calls required** - instant trial access.

**Flow:**

1. User registers (email or OAuth)
2. Verify email (if email/password)
3. Trial period starts automatically (14 days)
4. Access full platform immediately
5. Optional upgrade to paid tier anytime

**Benefits:**

- Fast user acquisition
- Low friction onboarding
- Scalable business model
- No enterprise sales cycle

### Subscription Model

**Trial**: Free, 14 days, full access

- Starts on email verification
- Auto-downgrade to Free tier on expiration

**Free**: $0/month, limited features

- Up to 100 clients
- Basic functionality
- Community support

**Pro**: $49/month (target), full features

- Unlimited clients
- All features
- Email marketing included
- Priority support

**Enterprise**: $149/month (target), advanced features

- Team collaboration
- Advanced reporting
- API access
- Dedicated support

## Technical Architecture

### Database Layer

**Platform**: Supabase (managed PostgreSQL)

**Schema**: 10 tables across two feature sets

**Authentication Tables (5):**

- `users` - User accounts and subscription data
- `oauth_providers` - Social login mappings
- `password_resets` - Temporary reset tokens
- `email_verifications` - Email verification tokens
- `auth_logs` - Security event logging

**Client Hub Tables (5):**

- `clients` - Client profiles
- `client_tags` - Tag assignments
- `client_documents` - Document metadata and storage paths
- `client_notes` - Activity and interaction notes
- `client_tasks` - Task tracking with due dates

**Key Patterns:**

- UUID primary keys (not auto-increment)
- Soft delete on user-facing entities
- Timestamps on all tables (created_at, updated_at)
- Composite unique constraints for logical uniqueness

### Authentication Layer

**Library**: Better Auth with Supabase adapter

**Session Management**: JWT tokens (stateless)

**Security Features:**

- Bcrypt password hashing (cost 12)
- Account lockout (5 attempts → 30 min)
- Rate limiting per endpoint
- Audit logging (7-day retention)
- HTTPS only (no HTTP)

**OAuth Providers:**

- Google (via Google Cloud Platform)
- Microsoft (via Azure AD)

### Application Layer (To Be Built)

**Frontend Framework**: Not yet selected

- Options: React, Next.js, Vue
- Component library: Likely Tailwind + shadcn/ui

**API Design**: RESTful endpoints

- `/api/auth/*` - Authentication endpoints
- `/api/clients/*` - Client management
- `/api/documents/*` - Document operations
- `/api/tasks/*` - Task management

**Deployment**: To be determined

- Options: Vercel, Netlify, custom hosting
- CDN for static assets
- Environment-based configuration

## Integration Points

### Supabase

**Services Used:**

- PostgreSQL database (primary data store)
- Supabase CLI (migration management)
- Supabase Studio (database UI)
- Built-in connection pooling
- Automatic backups

**Not Using:**

- Supabase Auth (using Better Auth instead)
- Supabase Storage (direct file upload TBD)
- Supabase Realtime (not needed for MVP)

### OAuth Providers

**Google Cloud Platform:**

- OAuth 2.0 Client ID
- Consent screen configuration
- Redirect URI management
- API scopes: email, profile

**Microsoft Azure AD:**

- App registration
- Client secret management
- Redirect URI configuration
- API permissions: email, profile, openid, User.Read

### Email Service (To Be Selected)

**Use Cases:**

- Verification emails (registration)
- Password reset emails
- Security notifications (account lockout)
- Future: Marketing campaigns

**Options Under Consideration:**

- SendGrid
- AWS SES
- Mailgun
- Postmark
- Resend

## Current Capabilities

### What Works Today

**Project Management:**

- ✅ CCPM system fully functional
- ✅ PRD creation and management
- ✅ Epic decomposition
- ✅ Task tracking
- ✅ Context management
- ✅ Local-only mode (no GitHub required)

**Documentation:**

- ✅ Two comprehensive PRDs (auth, client hub)
- ✅ User Authentication epic with 10 tasks
- ✅ Architecture decisions documented
- ✅ Database schemas defined
- ✅ Developer guide (CLAUDE.md)
- ✅ Context system initialized

### What Doesn't Exist Yet

**Application Code:**

- ❌ No frontend implemented
- ❌ No backend API
- ❌ No database created
- ❌ No migrations written
- ❌ No tests

**Infrastructure:**

- ❌ Supabase project not created
- ❌ OAuth apps not registered
- ❌ Email service not configured
- ❌ Domain not registered
- ❌ Hosting not set up

**Product:**

- ❌ No MVP launched
- ❌ No beta users
- ❌ No paying customers
- ❌ No revenue

## Success Metrics

### User Engagement

**Registration:**

- Trial sign-ups per month
- Registration completion rate >80%
- Email verification rate >90%

**Activation:**

- First client added within 24 hours: >70%
- 10+ clients added within 7 days: >50%
- Return visit within 7 days: >60%

**Retention:**

- Weekly active users: >60%
- Monthly retention: >80%
- Client Hub usage weekly: >70%

### Business Metrics

**Revenue:**

- Trial → paid conversion: >30%
- Average revenue per user: $50/month
- Customer lifetime value: $1,800+ (3 years)
- Monthly recurring revenue growth

**Performance:**

- Login time: <2 seconds
- Page load time: <3 seconds
- API response time: <500ms average
- System uptime: >99.9%

**Security:**

- Zero data breaches
- Zero critical vulnerabilities
- Audit log coverage: 100% of security events

## Competitive Advantages

1. **Data Portability** - Agents own their data, can switch brokerages freely
2. **Mobile-First** - Optimized for on-the-go usage, not desktop afterthought
3. **Affordable** - 50% cheaper than FollowUpBoss ($49 vs $99-299)
4. **Self-Service** - Instant trial access, no sales call required
5. **Real Estate-Specific** - Built for agent workflows, not generic CRM
6. **Modern Stack** - Fast, reliable, mobile-optimized technology

## Roadmap Summary

**Q1 2026 (Current)**: Planning → Implementation

- Complete Client Hub epic decomposition
- Implement User Authentication (10 tasks)
- Implement Client Hub core features
- Launch MVP

**Q2 2026**: Beta Testing

- Recruit 10-20 beta users
- Gather feedback
- Iterate on features
- Build Email Marketing PRD

**Q3 2026**: Public Launch

- Launch publicly
- Marketing campaign
- Acquire first 100 customers
- $4,000 MRR

**Q4 2026**: Scale

- Email marketing platform launch
- Scale to 1,000 users
- $40,000 MRR
- Feature parity with FollowUpBoss

**Year 2-3**: Growth

- 10,000 users
- Advanced features (teams, API, analytics)
- Market leader in agent-owned CRM category
