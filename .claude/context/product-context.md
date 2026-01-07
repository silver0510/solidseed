---
created: 2026-01-06T09:03:33Z
last_updated: 2026-01-06T09:03:33Z
version: 1.0
author: Claude Code PM System
---

# Product Context

## Product Vision

**Korella** is a modern CRM platform designed specifically for real estate professionals to manage client relationships, communications, and business workflows in one centralized, mobile-first platform.

### Primary Goal

Replace legacy CRM systems (particularly FollowUpBoss) with a faster, more affordable, mobile-optimized solution that gives real estate agents full ownership of their client data.

### Target Market

**Primary Users:**

- Independent real estate agents
- Team leads at brokerages
- Loan officers in mortgage lending

**Market Size:** Real estate professionals who manage 100-2,000+ client relationships and need better client management tools than spreadsheets or generic CRMs.

## Core Value Propositions

### 1. Data Portability

**Problem**: Agents lose all client data when switching brokers.
**Solution**: Korella data is owned by the agent, portable across brokerages.

### 2. Mobile-First Experience

**Problem**: Existing CRMs are desktop-centric, clunky on mobile.
**Solution**: Optimized for 375px+ screens, designed for on-the-go usage.

### 3. Affordable Pricing

**Problem**: FollowUpBoss and competitors are expensive ($99-299/month).
**Solution**: Free tier with 14-day trial, competitive pro pricing.

### 4. Simple Self-Service

**Problem**: Complex onboarding and enterprise sales cycles.
**Solution**: Self-service registration, instant trial access, no sales call required.

## User Personas

### Persona 1: Sarah - Independent Agent (Primary)

**Demographics:**

- Age: 35
- Experience: 5 years in real estate
- Client base: ~500 active clients
- Tech savvy: Moderate

**Context:**

- Works primarily from iPhone during showings
- Needs quick client lookup during property visits
- Frustrated with current system being slow on mobile
- Manages budget carefully as independent agent

**Goals:**

- Access client info instantly during showings
- Track follow-ups and important dates
- Organize clients by property type and location
- Keep all documents accessible

**Pain Points:**

- Current CRM doesn't work well on mobile
- Can't afford $149/month for FollowUpBoss
- Worried about losing data if changing brokerages
- Too many apps for different functions

**How Korella Helps:**

- Fast mobile access to all client data
- Affordable pricing with free tier option
- Data ownership and portability
- All-in-one platform for clients, tasks, documents

### Persona 2: Michael - Team Lead (Secondary)

**Demographics:**

- Age: 42
- Experience: 10 years, manages small team
- Client base: 1,200+ across buyer, seller, past client segments
- Tech savvy: High

**Context:**

- Uses both desktop and mobile
- Needs to organize clients by multiple criteria
- Concerned about data security
- Wants to own client relationships, not the brokerage

**Goals:**

- Segment clients by tags (buyer, seller, investor, etc.)
- Track all touchpoints and communications
- Store documents securely
- Maintain client relationships across broker changes

**Pain Points:**

- Risk of losing client data when changing brokerages
- Difficulty organizing 1,200+ clients effectively
- Needs better tagging and search capabilities
- Current system lacks flexibility

**How Korella Helps:**

- Flexible tag-based organization
- Complete data ownership
- Comprehensive document management
- Powerful search and filtering

### Persona 3: Jennifer - Loan Officer (Tertiary)

**Demographics:**

- Age: 38
- Experience: 7 years in mortgage lending
- Client base: ~800 in various loan stages
- Tech savvy: Moderate to high

**Context:**

- Tracks important dates (rate locks, closings, birthdays)
- Needs secure document storage for financial docs
- Uses both desktop and mobile depending on context
- Often forgets passwords across platforms

**Goals:**

- Track critical dates and deadlines
- Store sensitive documents securely
- Quick login without password hassle
- Organize clients by loan stage

**Pain Points:**

- Password fatigue across multiple platforms
- Need for secure document management
- Difficult to track multiple date types
- Mobile access needed for client calls

**How Korella Helps:**

- Social login (Google, Microsoft) for password-free access
- Secure document storage
- Task management with due dates
- Mobile-optimized for quick access

## Feature Priorities

### Phase 1: MVP (Current Planning)

**1. User Authentication**

- Email/password registration
- Google and Microsoft OAuth
- Email verification
- Password reset
- 14-day trial period
- Account security (lockout, rate limiting)

**Status**: Epic decomposed, ready for implementation

**2. Client Hub**

- Client profile management
- Tag-based organization
- Document storage (chronological)
- Notes and activity tracking
- Task management with due dates
- Search and filtering

**Status**: PRD complete, awaiting epic decomposition

### Phase 2: Communication (Planned)

**Email Marketing Integration:**

- Send campaigns to client segments
- Track opens and clicks
- Template management
- Automated follow-up sequences

**Status**: Not yet designed

### Phase 3: Advanced Features (Future)

**Potential Features:**

- SMS messaging
- Calendar integration
- Transaction pipeline tracking
- Team collaboration
- Mobile app (native iOS/Android)
- Zapier/API integrations
- Advanced reporting and analytics

**Status**: Vision only, no PRDs

## Core Use Cases

### Use Case 1: Agent Meets Prospect at Open House

**Scenario**: Sarah meets potential buyers at an open house.

**Steps:**

1. Opens Korella on iPhone
2. Taps "Add New Client"
3. Enters name, email, phone while chatting
4. Adds tag "Open House - 123 Main St - Jan 2026"
5. Adds note about property preferences
6. Creates follow-up task for tomorrow
7. Client is saved and searchable

**Business Value**: Captures lead immediately, ensures follow-up happens, no information lost.

### Use Case 2: Preparing for Client Meeting

**Scenario**: Michael has listing appointment with existing client.

**Steps:**

1. Searches client name in Korella
2. Reviews client profile:
   - Previous properties bought/sold
   - Communication history
   - Important dates and notes
   - Uploaded documents (past contracts)
3. Reviews tasks and next steps
4. Enters meeting fully prepared

**Business Value**: Demonstrates professionalism, builds trust, increases conversion.

### Use Case 3: Quick Login During Client Call

**Scenario**: Jennifer receives call from client asking about loan status.

**Steps:**

1. Opens Korella on phone
2. Taps "Sign in with Google" (already logged into Google)
3. Instantly authenticated (no password needed)
4. Searches client name
5. Retrieves loan details and answers question

**Business Value**: Fast access reduces client wait time, social login removes password friction.

### Use Case 4: Organizing Clients by Campaign

**Scenario**: Agent wants to send holiday greeting to all past clients.

**Steps:**

1. Filters clients by tag "Past Client"
2. Reviews list of 200+ past clients
3. (Future) Sends bulk email to segment
4. Tracks responses and engagement

**Business Value**: Enables targeted communication, maintains relationships, drives referrals.

## Business Model

### Revenue Streams

**Subscription Tiers:**

**Trial**: $0/month

- 14 days from email verification
- Full access to all features
- Auto-downgrade to Free tier on expiration

**Free**: $0/month

- Limited features (TBD)
- Up to 100 clients
- Basic support

**Pro**: $49/month (target pricing)

- Unlimited clients
- Full features
- Priority support
- Email marketing included

**Enterprise**: $149/month (target pricing)

- Team features
- Advanced reporting
- API access
- Dedicated support

### Target Metrics

**Acquisition:**

- Trial sign-ups: Primary metric
- Trial → Paid conversion: >30% target
- Cost per acquisition: <$50

**Retention:**

- Client retention: >90% annually
- Feature adoption: Client Hub used weekly
- NPS score: >50

**Revenue:**

- Average revenue per user (ARPU): $50-60/month
- Customer lifetime value (LTV): $1,800+ (3 years)
- LTV:CAC ratio: >3:1

## Competitive Landscape

### Primary Competitor: FollowUpBoss

**Strengths:**

- Established brand (2011+)
- Comprehensive features
- Integrations with major platforms

**Weaknesses:**

- Expensive ($99-299/month)
- Desktop-centric UI
- Complex onboarding
- Data locked to platform

**Korella Differentiation:**

- 50% lower price point
- Mobile-first design
- Self-service onboarding
- Data portability

### Secondary Competitors

**Salesforce (with real estate add-ons):**

- Too complex and expensive for independent agents
- Overkill for typical use cases

**Generic CRMs (HubSpot, Pipedrive):**

- Not real estate-specific
- Lack industry workflows
- Require extensive customization

**Spreadsheets/Notion:**

- Manual and time-consuming
- No mobile optimization
- No automation
- Difficult to scale

## Success Criteria

### MVP Success Metrics

**Launch Readiness:**

- Authentication system fully functional
- Client Hub core features working
- Mobile responsive on real devices
- <2s page load times
- Zero critical security vulnerabilities

**User Validation:**

- 10 beta users successfully onboard
- Average session duration >5 minutes
- Feature completion rate >70%
- NPS score from beta users >40

**Technical Performance:**

- 100+ concurrent users supported
- 99.9% uptime (Supabase SLA)
- <500ms API response times
- Zero data loss incidents

### Long-Term Success

**Year 1:**

- 1,000 active users
- 30% trial → paid conversion
- $40,000 MRR (Monthly Recurring Revenue)
- Feature parity with FollowUpBoss core features

**Year 3:**

- 10,000 active users
- Email marketing platform live
- $400,000 MRR
- Market leader in agent-owned CRM category

## Regulatory & Compliance

### GDPR Compliance

**Requirements:**

- User data export capability
- Right to be forgotten (account deletion)
- Clear privacy policy
- Cookie consent
- Data processing agreements

**Implementation:**

- Export endpoint for user data
- Soft delete with eventual hard delete
- Privacy policy on registration
- Cookie banner for EU users
- Supabase compliance inherits EU data residency

### Data Security

**Standards:**

- Encryption at rest (Supabase)
- Encryption in transit (HTTPS only)
- Secure password storage (bcrypt cost 12)
- Security audit logging
- Regular security testing

## Product Roadmap

### Q1 2026 (Current Quarter)

- ✅ PRD: User Authentication
- ✅ PRD: Client Hub
- ⏳ Epic: User Authentication (decomposed)
- ⏳ Epic: Client Hub (pending)
- 🎯 Implementation: Auth + Client Hub MVP

### Q2 2026

- Email marketing PRD
- Email marketing implementation
- Beta launch with 10-20 users
- Feedback iteration

### Q3 2026

- Public launch
- Marketing campaign
- First 100 paying customers
- Feature refinement

### Q4 2026

- Scale to 1,000 users
- Advanced features based on feedback
- Team collaboration features
- Mobile app exploration

## Open Questions

**Frontend Framework:**

- React, Next.js, or Vue?
- Server-side rendering vs. client-side?
- Component library selection?

**Email Service:**

- SendGrid, AWS SES, Mailgun, Postmark, or Resend?
- Transactional vs. marketing email needs?

**Deployment:**

- Vercel, Netlify, or custom hosting?
- CDN requirements?
- Cost optimization strategies?

**Feature Prioritization:**

- What free tier limitations make sense?
- Which advanced features justify Enterprise tier?
- Should we build mobile app or PWA first?

## Notes

- Product is in planning phase, no MVP yet launched
- Focus on real estate agent needs, not general CRM
- Data portability is key differentiator
- Mobile-first is non-negotiable
- Self-service onboarding required for scalability
