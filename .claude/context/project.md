---
created: 2026-01-09T14:43:01Z
last_updated: 2026-01-09T14:43:01Z
version: 1.0
author: Claude Code PM System
---

# Project Overview

## What We're Building

**Korella** is a mobile-first CRM platform for real estate professionals that enables agents, brokers, and loan officers to manage client relationships, documents, and communications - with complete data ownership and portability.

### Elevator Pitch

"Korella is FollowUpBoss reimagined for mobile - half the price, with data you actually own. Built specifically for independent real estate agents who need their client data accessible anywhere, anytime."

### Core Value Propositions

1. **Data Portability** - Agents own their data, can switch brokerages freely
2. **Mobile-First** - Optimized for 375px+ screens, designed for on-the-go usage
3. **Affordable** - 50% cheaper than FollowUpBoss ($49 vs $99-299)
4. **Self-Service** - Instant trial access, no sales call required

## Current Status

**Phase**: Project Setup & Infrastructure
**Progress**: ~90% (9 of 10 setup tasks complete)
**Next Milestone**: Complete project setup, begin User Authentication implementation

### Recent Accomplishments

- ✅ Next.js 16 project initialized with TypeScript, Tailwind CSS
- ✅ PWA configuration (offline support, manifest, service worker)
- ✅ Testing frameworks (Vitest, Playwright)
- ✅ Supabase integration (database client, storage bucket)
- ✅ Google OAuth setup (GCP project, credentials configured)
- ✅ Resend & Sentry setup (email service, error monitoring)
- ✅ Vercel CLI configuration
- ✅ Environment validation with Zod schema
- ✅ Health check endpoint with service monitoring

### Immediate Next Steps

1. Complete Project Setup Task 010 (final integration testing)
2. Start User Authentication Epic (database schema migrations)
3. Convert Client Hub PRD to Epic and decompose into tasks

## Core Features

### 1. User Authentication (In Planning)

**Purpose**: Secure access control with multiple login options

**Key Capabilities:**
- Email/password registration with verification
- Google & Microsoft OAuth ("Sign in with..." buttons)
- Password reset via email link
- Account security (lockout after 5 failed attempts, rate limiting)
- 14-day free trial starting on email verification
- JWT session management (3-day default, 30-day with "remember me")

**Status**: Epic decomposed into 10 tasks, ready for implementation

### 2. Client Hub (In Planning)

**Purpose**: Centralized client management and relationship tracking

**Key Capabilities:**

**Client Profiles:**
- Full contact information (name, email, phone, address)
- Custom notes and activity history
- Important dates tracking
- Soft delete (data recovery possible)

**Tag-Based Organization:**
- User-defined tags ("Buyer", "Seller", "Open House 2026-01", etc.)
- Multiple tags per client
- Flexible categorization without rigid folders
- Filter and search by tags

**Document Management:**
- Upload contracts, disclosures, photos
- Chronological organization (sorted by upload date)
- Secure storage via Supabase
- Optional descriptions for context

**Notes & Tasks:**
- Timestamped interaction notes
- Tasks with due dates and priorities
- Follow-up reminders

**Status**: PRD complete, epic decomposition pending

### 3. Email Marketing (Future - Phase 2)

**Purpose**: Targeted communication campaigns to client segments

**Planned Capabilities:**
- Send campaigns to clients filtered by tags
- Email templates and tracking (opens, clicks)
- Automated follow-up sequences

**Status**: Vision only, no PRD yet

## Project Scope

### In Scope (Phase 1 - MVP)

**Authentication:**
- Email/password registration with verification
- Google & Microsoft OAuth integration
- Password reset functionality
- Session management with JWT tokens
- Account lockout and rate limiting
- 14-day trial period tracking

**Client Hub:**
- Client profile CRUD operations
- Tag-based organization
- Document upload and storage
- Notes with timestamps
- Task management with due dates
- Search and filtering
- Soft delete with data recovery

**Infrastructure:**
- Supabase PostgreSQL database
- Better Auth library integration
- Mobile-responsive UI (375px+ width)
- HTTPS and security headers
- PWA capabilities (offline support)

### Out of Scope (Phase 1)

**Explicitly NOT Building in MVP:**
- Email marketing campaigns
- SMS messaging
- Calendar integration
- Transaction pipeline tracking
- Team collaboration features
- Native mobile apps (iOS/Android)
- Public API for third-party integrations
- Advanced reporting and analytics
- Document categories (simplified to chronological)
- Multi-language support
- Custom branding/white-label

**Deferred to Later Phases:**
- Email campaigns (Phase 2)
- Team features (Phase 3)
- Advanced analytics (Phase 3)
- Native mobile apps (Phase 4)

## Key Decisions

### Technology Stack

**Database: Supabase (PostgreSQL)**
- **Rationale**: Managed PostgreSQL with Studio UI, built-in backups, connection pooling
- **Alternative Considered**: Self-hosted PostgreSQL
- **Decided**: 2026-01-06

**Authentication: Better Auth**
- **Rationale**: Modern library with OAuth, email verification, JWT support
- **Alternative Considered**: Auth0, custom implementation
- **Decided**: 2026-01-06

**Frontend: Next.js 16 + Tailwind + shadcn/ui**
- **Rationale**: Full-stack React framework, server components, excellent mobile performance
- **Alternative Considered**: React SPA, Vue, separate backend
- **Decided**: 2026-01-07

**Email: Resend (transactional) + Nylas (marketing in Phase 2)**
- **Rationale**: Resend for simple transactional emails, Nylas for Gmail/Outlook integration
- **Alternative Considered**: SendGrid, AWS SES, Mailgun
- **Decided**: 2026-01-07

### Architecture Decisions

**Mobile-First Approach:**
- All UI designed for 375px+ width first
- Desktop is enhancement, not primary
- Driven by real estate agent workflow (on-the-go usage)

**Soft Delete Pattern:**
- Use `is_deleted` flag instead of hard deletes
- Enables data recovery and audit trails
- GDPR compliant with export capability

**Trial Period Strategy:**
- 14 days from email verification (not registration)
- Auto-downgrade to free tier on expiration
- Enables self-service user acquisition

**Document Management:**
- Chronological only (no categories in MVP)
- Original plan had custom categories
- **Rationale**: Simplify MVP, add categorization later if needed

### Design Principles

1. **Agent-First, Always** - Every decision prioritizes agent needs
2. **Simple Over Complex** - Prefer simple solutions that work
3. **Mobile-First, Forever** - Mobile experience never compromised
4. **Data Portability** - Agents own data (non-negotiable)
5. **Affordable Access** - Pricing enables independent agents

## Success Metrics

### MVP Launch Criteria

**Functional Requirements:**
- ✅ Users can register with email/password
- ✅ Users can login with Google or Microsoft
- ✅ Email verification required for activation
- ✅ 14-day trial period starts automatically
- ✅ Users can create, edit, delete client profiles
- ✅ Users can upload and manage documents
- ✅ Users can add tags to organize clients
- ✅ Users can create notes and tasks
- ✅ Mobile responsive on iPhone SE (375px)

**Performance Requirements:**
- Login: <2 seconds
- Page load: <3 seconds
- API response: <500ms average
- Support 100+ concurrent users

**Security Requirements:**
- HTTPS only (no HTTP)
- Password hashing (bcrypt cost 12)
- Account lockout (5 failed attempts)
- Rate limiting on sensitive endpoints
- Security audit logging

### Business Success Metrics

**Acquisition:**
- Trial sign-ups: 50+ in first month
- Registration completion rate: >80%
- Email verification rate: >90%

**Activation:**
- Users add first client: >70% within 24 hours
- Users add 10+ clients: >50% within 7 days
- Return visit within 7 days: >60%

**Retention:**
- Weekly active users: >60% of registered
- Monthly retention: >80%
- Trial → paid conversion: >30%

**Revenue:**
- ARPU (Average Revenue Per User): $50/month
- LTV (Customer Lifetime Value): $1,800+ (3 years)
- LTV:CAC ratio: >3:1

### Performance Targets

**Response Times:**
- Login: <2 seconds
- Registration: <3 seconds
- OAuth flow: <5 seconds end-to-end
- API endpoints: <500ms average
- Database queries: <100ms average

**Scalability:**
- Support 100+ concurrent logins
- Handle 1,000+ active users
- Maintain performance with 10,000+ client records per user

**Availability:**
- 99.9% uptime target
- Supabase SLA: 99.9%

## Competitive Advantages

1. **Data Portability** - Agents own their data, can switch brokerages freely
2. **Mobile-First** - Optimized for on-the-go usage, not desktop afterthought
3. **Affordable** - 50% cheaper than FollowUpBoss
4. **Self-Service** - Instant trial access, no sales call required
5. **Real Estate-Specific** - Built for agent workflows, not generic CRM
6. **Modern Stack** - Fast, reliable, mobile-optimized technology

## Project Constraints

### Technical Constraints

- Must use Supabase for PostgreSQL database
- Must use Better Auth library for authentication
- Must support Google and Microsoft OAuth
- Must be mobile-responsive (375px+ width)
- Must use ISO 8601 datetime format (UTC)
- Must use relative paths in all documentation

### Business Constraints

- Bootstrap/self-funded (minimize infrastructure costs)
- Solo founder/developer (use AI assistance)
- MVP launch target: Q1 2026

### Regulatory Constraints

**GDPR Compliance:**
- User data export capability
- Right to be forgotten (account deletion)
- Clear privacy policy
- Cookie consent for EU users

**Data Security:**
- Encryption at rest and in transit
- Audit logging for security events
- Secure password storage

## Risk Management

### Current Risks

**Technical Risks:**
1. Better Auth + Supabase compatibility (Low probability, High impact)
2. OAuth provider setup complexity (Medium probability, Medium impact)
3. Mobile performance (Medium probability, High impact)

**Business Risks:**
1. Low trial → paid conversion (Medium probability, High impact)
2. Feature creep delaying launch (High probability, Medium impact)
3. Market competition (Low probability, Medium impact)

### Mitigation Strategies

- Test Better Auth integration early (Task 002)
- Follow OAuth documentation carefully, use provider sandboxes
- Mobile-first design, test on real devices, performance budgets
- Strong onboarding, feature education, value demonstration
- Strict scope adherence, "Out of Scope" section in PRDs
- Focus on unique value props (portability, mobile-first, pricing)

## Stakeholders

### Primary Stakeholder

**Role**: Founder/Product Owner
**Responsibilities**: Product decisions, requirements, roadmap

### Target Users

**Sarah - Independent Agent** (Primary persona)
- Needs: Mobile access, affordable pricing, data ownership
- Pain Points: Expensive CRM, poor mobile experience, data lock-in

**Michael - Team Lead** (Secondary persona)
- Needs: Client organization, document management, data security
- Pain Points: Risk of losing data, inflexible categorization

**Jennifer - Loan Officer** (Tertiary persona)
- Needs: Secure documents, password-free login, date tracking
- Pain Points: Password fatigue, difficult mobile access

## Notes

- Project is in early implementation phase (infrastructure setup)
- Database schema defined but migrations not yet created
- Ready to begin User Authentication epic implementation
- Client Hub PRD complete, awaiting epic decomposition
- Focus on MVP scope - resist feature creep
- Data portability is key differentiator - never compromise
