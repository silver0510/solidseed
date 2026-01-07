---
created: 2026-01-06T09:03:33Z
last_updated: 2026-01-06T09:03:33Z
version: 1.0
author: Claude Code PM System
---

# Project Brief

## Project Overview

**Project Name**: Korella CRM
**Type**: SaaS Web Application
**Industry**: Real Estate Technology (PropTech)
**Target Users**: Real estate agents, brokers, and loan officers
**Status**: Planning phase, pre-MVP

## What We're Building

A mobile-first CRM platform specifically designed for real estate professionals to manage client relationships, documents, tasks, and communications in one centralized system.

**Core Platform Features:**
1. **Client Hub** - Centralized client management with profiles, tags, documents, notes, and tasks
2. **User Authentication** - Secure registration and login with email/password and social OAuth
3. **Email Marketing** (Future) - Campaign management and communication tracking

**Primary Differentiator**: Data portability - agents own their data and can take it with them when switching brokerages.

## Why This Project Exists

### Market Opportunity

**Problem**: Real estate agents use fragmented, expensive, desktop-centric CRMs that lock their data to the platform.

**Existing Solutions**:
- FollowUpBoss: $99-299/month, desktop-first, data lock-in
- Salesforce: Too complex and expensive for independent agents
- Generic CRMs: Lack real estate-specific workflows
- Spreadsheets: Manual, no automation, poor mobile experience

**Market Gap**: No affordable, mobile-first CRM with data portability for independent real estate agents.

### Target Market Size

- **Primary**: Independent real estate agents (1.5M+ in US)
- **Secondary**: Team leads at brokerages
- **Tertiary**: Loan officers in mortgage lending

**Addressable Market**: Agents managing 100-2,000 client relationships who need better tools than spreadsheets.

## Project Goals

### Primary Objectives

1. **Launch MVP** (Q1 2026)
   - User authentication with email and OAuth
   - Client Hub with core features
   - Mobile-responsive (375px+ width)
   - 14-day trial with self-service registration

2. **Validate Product-Market Fit** (Q2 2026)
   - 10-20 beta users successfully onboarding
   - >5 minute average session duration
   - >70% feature completion rate
   - NPS >40 from beta users

3. **Acquire First 100 Customers** (Q3 2026)
   - Public launch
   - >30% trial → paid conversion
   - $4,000 MRR (Monthly Recurring Revenue)
   - <$50 customer acquisition cost

### Secondary Objectives

4. **Build Email Marketing Platform** (Q4 2026)
   - Campaign builder
   - Segmentation by client tags
   - Open/click tracking
   - Automated sequences

5. **Scale to 1,000 Users** (End Year 1)
   - $40,000 MRR
   - 99.9% uptime
   - Feature parity with FollowUpBoss

## Success Criteria

### MVP Launch Criteria

**Functional Requirements:**
- ✅ Users can register with email/password
- ✅ Users can login with Google or Microsoft
- ✅ Email verification required for activation
- ✅ 14-day trial period automatically starts
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

## Project Scope

### In Scope (Phase 1 - MVP)

**Authentication:**
- Email/password registration with verification
- Google OAuth integration
- Microsoft OAuth integration
- Password reset via email
- Session management with JWT tokens
- Account lockout and rate limiting
- 14-day trial period tracking

**Client Hub:**
- Client profile CRUD (Create, Read, Update, Delete)
- Tag-based organization
- Document upload and storage
- Notes with timestamps
- Task management with due dates
- Search and filtering
- Soft delete (data recovery)

**Infrastructure:**
- Supabase PostgreSQL database
- Better Auth library integration
- Mobile-responsive UI (375px+ width)
- HTTPS and security headers

### Out of Scope (Phase 1)

**Explicitly NOT Building:**
- Email marketing campaigns
- SMS messaging
- Calendar integration
- Transaction pipeline tracking
- Team collaboration features
- Mobile native apps (iOS/Android)
- API for third-party integrations
- Advanced reporting and analytics
- Document categories (simplified to chronological)
- Multi-language support
- Custom branding/white-label

**Deferred to Later Phases:**
- Email campaigns (Phase 2)
- Team features (Phase 3)
- Advanced analytics (Phase 3)
- Native mobile apps (Phase 4)

## Key Constraints

### Technical Constraints

**Technology Stack:**
- Must use Supabase for PostgreSQL database
- Must use Better Auth library for authentication
- Must support Google and Microsoft OAuth
- Must be mobile-responsive (375px+ width)
- Must use ISO 8601 datetime format (UTC)
- Must use relative paths in all documentation

**Performance Constraints:**
- Login: <2 seconds
- Registration: <3 seconds
- OAuth flow: <5 seconds
- API response: <500ms average
- Support 100+ concurrent logins

**Security Constraints:**
- HTTPS required (no HTTP allowed)
- Bcrypt cost factor: 12 minimum
- JWT expiration: 3 days default, 30 days max
- Account lockout: 5 failed attempts → 30 minutes
- Rate limiting: 10 login attempts/min, 3 password resets/hr

### Business Constraints

**Budget:**
- Bootstrap/self-funded (implied - no budget specified)
- Use free tiers where possible (Supabase, OAuth, email service)
- Minimize infrastructure costs pre-revenue

**Timeline:**
- MVP launch target: Q1 2026
- Beta testing: Q2 2026
- Public launch: Q3 2026

**Team:**
- Solo founder/developer (implied from project structure)
- Using AI assistance (Claude Code) for development
- No dedicated designer (use component libraries)

### Regulatory Constraints

**GDPR Compliance:**
- User data export capability
- Right to be forgotten (account deletion)
- Clear privacy policy
- Cookie consent for EU users

**Data Security:**
- Encryption at rest
- Encryption in transit
- Audit logging for security events
- Secure password storage

## Project Stakeholders

### Primary Stakeholder
**Role**: Founder/Product Owner
**Responsibilities**: Product decisions, requirements, roadmap

### Target Users (Stakeholders)

**Sarah - Independent Agent**
- Needs: Mobile access, affordable pricing, data ownership
- Pain Points: Expensive CRM, poor mobile experience, data lock-in

**Michael - Team Lead**
- Needs: Client organization, document management, data security
- Pain Points: Risk of losing data, inflexible categorization

**Jennifer - Loan Officer**
- Needs: Secure documents, password-free login, date tracking
- Pain Points: Password fatigue, difficult mobile access

## Risks & Mitigation

### Technical Risks

**Risk 1: Better Auth + Supabase Compatibility**
- Impact: High (blocks authentication)
- Probability: Low (both support PostgreSQL)
- Mitigation: Test integration in Task 002, validate before proceeding

**Risk 2: OAuth Provider Complexity**
- Impact: Medium (delays launch if broken)
- Probability: Medium (first-time setup)
- Mitigation: Follow Task 008 documentation, use provider sandboxes

**Risk 3: Mobile Performance**
- Impact: High (core value proposition)
- Probability: Medium (depends on implementation)
- Mitigation: Mobile-first design, test on real devices, performance budgets

### Business Risks

**Risk 4: Low Trial → Paid Conversion**
- Impact: High (revenue dependent)
- Probability: Medium (typical SaaS challenge)
- Mitigation: Strong onboarding, feature education, clear value demonstration

**Risk 5: Feature Creep**
- Impact: Medium (delays launch)
- Probability: High (common trap)
- Mitigation: Strict scope adherence, "Out of Scope" section in PRDs

**Risk 6: Market Competition**
- Impact: Medium (reduces differentiation)
- Probability: Low (no direct competitor in data portability niche)
- Mitigation: Focus on unique value props (portability, mobile-first, pricing)

## Dependencies

### External Dependencies

**Supabase:**
- Account creation required
- Project setup needed
- Free tier limitations apply

**OAuth Providers:**
- Google Cloud Platform project
- Microsoft Azure AD app registration
- Domain verification for production

**Email Service:**
- Not yet selected (SendGrid, AWS SES, Mailgun, Postmark, Resend)
- Needed for verification and password reset emails

### Internal Dependencies

**Frontend Framework:**
- Not yet selected (React, Next.js, Vue)
- Blocks UI implementation (Task 006)
- Decision needed before epic starts

**Design System:**
- Not yet selected (Tailwind + shadcn/ui likely)
- Component library needed for consistency

## Project Timeline

### Phase 1: MVP (Q1 2026)

**Planning** (Current):
- ✅ PRD: User Authentication (complete)
- ✅ PRD: Client Hub (complete)
- ✅ Epic: User Authentication (decomposed)
- ⏳ Epic: Client Hub (pending decomposition)

**Implementation** (8-12 weeks):
- Week 1-2: Supabase setup, database schema (Task 001)
- Week 3-4: Better Auth integration (Task 002)
- Week 5-8: Authentication APIs and UI (Tasks 003-006)
- Week 9-10: OAuth setup and email service (Tasks 007-008)
- Week 11-12: Trial period and testing (Tasks 009-010)

**Testing & Launch**:
- Security audit (OWASP checklist)
- Performance testing
- Mobile device testing
- Beta user validation

### Phase 2: Email Marketing (Q2 2026)

**Planning**:
- Email marketing PRD
- Epic decomposition
- Integration design

**Implementation**:
- Campaign builder
- Segmentation
- Email templates
- Tracking and analytics

### Phase 3: Growth (Q3-Q4 2026)

- Public launch
- User acquisition
- Feature iteration
- Scale to 1,000 users

## Communication Plan

**Project Management:**
- CCPM system (`.claude/` directory)
- Local-only mode (no GitHub sync required)
- Context updates after major milestones

**Documentation:**
- PRDs in `.claude/prds/`
- Epics in `.claude/epics/`
- Context in `.claude/context/`
- Developer guide in `CLAUDE.md`

**Status Updates:**
- Use `/pm:status` for dashboard
- Use `/pm:standup` for daily summary
- Update context with `/context:update`

## Current Status

**Phase**: Planning and requirements definition
**Progress**: ~15% (requirements phase)
**Next Milestone**: Supabase project creation and Task 001 start
**Blockers**: None - ready to proceed

**Recent Accomplishments:**
- ✅ Created comprehensive PRDs for two core features
- ✅ Decomposed User Authentication epic into 10 tasks
- ✅ Established technology stack (Supabase, Better Auth)
- ✅ Defined architecture patterns and database schemas
- ✅ Created developer documentation (CLAUDE.md)

**Immediate Next Steps:**
1. Create Supabase project
2. Start Task 001: Database schema
3. Decompose Client Hub epic
4. Select frontend framework
