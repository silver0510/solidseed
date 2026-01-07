---
created: 2026-01-06T09:03:33Z
last_updated: 2026-01-06T09:03:33Z
version: 1.0
author: Claude Code PM System
---

# Project Vision

## Long-Term Vision

**Mission**: Empower real estate professionals with a CRM platform they truly own, optimized for how they actually work - mobile-first, affordable, and built for their unique workflows.

**Vision (5 Years)**: Korella becomes the de facto CRM for independent real estate agents, known for data portability, mobile experience, and putting agents first - not brokerages or vendors.

## Strategic Goals

### Year 1: Validate & Launch (2026)

**Primary Goal**: Prove product-market fit with independent real estate agents.

**Key Milestones:**
- Launch MVP (Q1): User auth + Client Hub
- Beta validation (Q2): 10-20 users, >40 NPS
- Public launch (Q3): First 100 customers, $4K MRR
- Email marketing (Q4): Campaign platform, 1,000 users, $40K MRR

**Success Criteria:**
- >30% trial → paid conversion rate
- >80% monthly retention
- Feature parity with FollowUpBoss core features
- Clear unit economics (LTV:CAC > 3:1)

### Year 2: Scale & Expand (2027)

**Primary Goal**: Scale to 5,000 active users and expand feature set.

**Strategic Initiatives:**

**User Acquisition:**
- Content marketing (agent blogs, tutorials)
- Referral program (agent-to-agent)
- Partnership with real estate training companies
- Paid advertising (Google, Facebook targeting agents)

**Product Expansion:**
- SMS messaging integration
- Calendar sync (Google Calendar, Outlook)
- Transaction pipeline tracking
- Advanced reporting and analytics
- Mobile PWA (Progressive Web App)

**Revenue Goals:**
- 5,000 active users
- $200K MRR
- 50% year-over-year growth
- Positive unit economics

### Year 3: Dominate Niche (2028)

**Primary Goal**: Become market leader in agent-owned CRM category.

**Strategic Initiatives:**

**Platform Maturity:**
- Native mobile apps (iOS, Android)
- Public API for integrations
- Zapier integration marketplace
- Team collaboration features
- Enterprise tier with advanced features

**Market Position:**
- 10,000+ active users
- $400K+ MRR
- Recognized brand in real estate technology
- Industry partnerships and integrations

**Expansion Options:**
- International markets (Canada, UK, Australia)
- Adjacent verticals (insurance agents, financial advisors)
- White-label for brokerages

### Year 4-5: Market Leadership (2029-2030)

**Vision**: Korella is synonymous with "agent-owned CRM" - the platform agents choose when they want control of their business data.

**Strategic Options:**

**Option A: Scale Independently**
- 50,000+ users
- $2M+ MRR
- Bootstrap to profitability
- Maintain independence and agent-first mission

**Option B: Raise Capital**
- Venture funding for aggressive growth
- Expand team and features rapidly
- Pursue acquisition of competitors
- Path to IPO or strategic exit

**Option C: Strategic Partnership**
- Partner with major real estate franchise (RE/MAX, Keller Williams)
- White-label offering for brokerage networks
- Revenue share model

**Decision Point**: Year 3 (based on growth trajectory and market dynamics)

## Product Evolution

### Phase 1: Core CRM (Current → 2026)

**Features:**
- User authentication (email/password, OAuth)
- Client Hub (profiles, tags, documents, notes, tasks)
- Email marketing campaigns
- Mobile-responsive web app

**Goal**: Replace FollowUpBoss for independent agents

### Phase 2: Communication Hub (2027)

**Additional Features:**
- SMS messaging to clients
- Email tracking (opens, clicks)
- Automated follow-up sequences
- Communication history timeline
- Template library (email, SMS)

**Goal**: Centralize all client communication

### Phase 3: Transaction Management (2027-2028)

**Additional Features:**
- Transaction pipeline tracking
- Deal stages and milestones
- Commission tracking
- Important date reminders
- Contract milestone tracking

**Goal**: Manage entire sales process, not just contacts

### Phase 4: Team & Collaboration (2028)

**Additional Features:**
- Team member accounts
- Permission levels (admin, agent, assistant)
- Shared client access
- Activity feed for team
- Performance dashboards

**Goal**: Support teams and growing brokerages

### Phase 5: Intelligence & Automation (2029+)

**Visionary Features:**
- AI-powered follow-up suggestions
- Predictive lead scoring
- Automated task generation
- Smart client segmentation
- Market insights and trends
- Voice-to-text note taking
- AI email draft assistance

**Goal**: Intelligent CRM that helps agents work smarter

## Market Positioning

### Target Market Evolution

**Phase 1 (2026)**: Independent agents, 100-1,000 clients
- Solo practitioners
- Small teams (2-3 people)
- Price-sensitive
- Mobile-first users

**Phase 2 (2027-2028)**: Growing teams, 1,000-5,000 clients
- Team leads with 5-10 agents
- Boutique brokerages
- Need collaboration features
- Willing to pay for team features

**Phase 3 (2029+)**: Small-to-medium brokerages
- 10-50 agents per office
- Need admin controls
- Want custom branding
- Enterprise security requirements

**Explicitly NOT Targeting:**
- Large franchises (RE/MAX, Keller Williams) - already have systems
- Corporate brokerages - too complex, long sales cycles
- Non-real estate industries (unless strategic expansion)

### Competitive Strategy

**Differentiation Over Time:**

**vs. FollowUpBoss:**
- **Price**: 50% cheaper ($49 vs $99)
- **Mobile**: Built mobile-first, not retrofitted
- **Data**: Agent owns data, not locked in
- **Onboarding**: Self-service, no sales call

**vs. Salesforce/HubSpot:**
- **Simplicity**: Real estate-specific, not generic CRM
- **Price**: Fraction of enterprise CRM cost
- **Setup**: Minutes, not months
- **Usability**: No training required

**vs. Spreadsheets/Notion:**
- **Automation**: Built-in workflows and reminders
- **Mobile**: Native mobile optimization
- **Security**: Enterprise-grade security
- **Scale**: Handles thousands of clients effortlessly

### Brand Promise

**Core Promise**: "Your clients, your data, your success."

**Brand Values:**
1. **Agent-First**: Decisions prioritize agents, not brokerages or vendors
2. **Ownership**: Agents own and control their business data
3. **Accessibility**: Mobile-first, affordable, easy to use
4. **Trust**: Secure, reliable, transparent
5. **Growth**: Tools that scale with agent's business

**Brand Voice:**
- Professional but approachable
- Empowering, not patronizing
- Straight-talking, no marketing fluff
- Solution-focused

## Technology Vision

### Architecture Evolution

**Current (2026)**: Monolithic web application
- Single codebase
- Supabase PostgreSQL
- Server-side rendering or SPA
- Simple deployment

**Mid-term (2027-2028)**: Service-oriented
- API-first architecture
- Microservices for key functions
- Mobile apps consuming API
- Separate email/SMS services

**Long-term (2029+)**: Platform ecosystem
- Public API for developers
- Integration marketplace
- Webhook system
- Plugin architecture
- Multi-tenant infrastructure

### Technical Priorities

**Always:**
- Mobile performance (<2s load times)
- Data security and privacy
- Uptime and reliability (99.9%+)
- Simplicity over complexity

**As We Scale:**
- Scalability to millions of records
- Real-time sync across devices
- Offline-first mobile apps
- Advanced search (Elasticsearch)
- Analytics at scale

### Innovation Areas

**Machine Learning (2029+):**
- Lead scoring predictions
- Churn prediction
- Optimal follow-up timing
- Client lifetime value predictions
- Automated task prioritization

**Voice & Natural Language:**
- Voice-to-text note taking
- Voice commands ("Add note for John Smith")
- Natural language search
- AI-assisted email composition

**Mobile Innovation:**
- Camera integration (document scanning)
- Location-based features (nearby clients)
- Apple Watch companion app
- Push notifications for important events

## Business Model Evolution

### Revenue Streams

**Primary (2026+)**: Subscription tiers
- Trial → Free → Pro → Enterprise progression
- Monthly and annual billing
- Self-service checkout

**Secondary (2027+)**: Premium features
- SMS credits (pay-per-use)
- Advanced integrations (Zapier premium)
- Additional storage
- Custom branding

**Potential (2028+)**: Platform revenue
- API access for developers
- Integration marketplace (revenue share)
- White-label for brokerages
- Training and certification programs

### Pricing Evolution

**Phase 1 (Launch)**: Aggressive pricing
- Free tier (generous limits)
- Pro: $49/month
- Enterprise: $149/month
- Goal: Market penetration

**Phase 2 (Growth)**: Value-based pricing
- Free tier (limited)
- Pro: $69/month (as features expand)
- Team: $59/month per user
- Enterprise: Custom pricing
- Goal: Revenue optimization

**Phase 3 (Maturity)**: Premium positioning
- Free tier (very limited, lead gen only)
- Pro: $99/month
- Team: $79/month per user
- Enterprise: $199+ per seat
- Goal: Profitability and sustainability

## Success Metrics Evolution

### Year 1: Validation
- Users: 1,000
- MRR: $40K
- Conversion: >30%
- Retention: >80%
- NPS: >40

### Year 2: Growth
- Users: 5,000
- MRR: $200K
- Conversion: >35%
- Retention: >85%
- NPS: >50

### Year 3: Scale
- Users: 10,000
- MRR: $400K
- Conversion: >40%
- Retention: >90%
- NPS: >60

### Year 5: Leadership
- Users: 50,000+
- MRR: $2M+
- Conversion: >45%
- Retention: >90%
- NPS: >70
- Brand: Top 3 agent CRM

## Risk Management

### Long-Term Risks

**Market Risk:**
- FollowUpBoss launches mobile-first redesign
- **Mitigation**: Data portability advantage, faster iteration

**Technology Risk:**
- Better Auth or Supabase discontinues service
- **Mitigation**: Architecture allows provider swapping

**Competitive Risk:**
- Well-funded competitor enters market
- **Mitigation**: Strong brand, loyal user base, unique positioning

**Economic Risk:**
- Real estate market downturn reduces agent budgets
- **Mitigation**: Affordable pricing, essential tool positioning

### Strategic Pivots

**If Growth Slower Than Expected:**
- Expand to adjacent markets (insurance, financial advisors)
- Partner with brokerages for white-label
- Reduce pricing further for volume

**If Growth Faster Than Expected:**
- Raise capital to accelerate development
- Expand team quickly
- Build moats (network effects, integrations)

**If Market Changes Dramatically:**
- Pivot to most valuable segment
- Focus on highest-margin customers
- Consider strategic partnerships or acquisition

## Guiding Principles

### Strategic Principles

1. **Agent-First, Always**: Every decision prioritizes agent needs over vendor convenience
2. **Simple Over Complex**: Prefer simple solutions that work over complex features few use
3. **Mobile-First, Forever**: Mobile experience never compromised for desktop convenience
4. **Data Portability**: Agents own data - non-negotiable core value
5. **Affordable Access**: Pricing enables independent agents, not just teams/brokerages

### Product Principles

1. **Solve Real Problems**: Build what agents need, not what's technically interesting
2. **Fast and Reliable**: Performance and uptime are features
3. **Easy to Learn**: No training required, intuitive from first use
4. **Scalable Design**: Works equally well for 10 or 10,000 clients
5. **Secure by Default**: Security and privacy built in, not bolted on

### Growth Principles

1. **Organic First**: Word-of-mouth and product quality drive growth
2. **Customer Success**: Retention more important than acquisition
3. **Sustainable Economics**: Profitable unit economics from day one
4. **Patient Capital**: Grow sustainably, not just fast
5. **Long-Term Thinking**: Build for decades, not exit in years

## The North Star

**Ultimate Goal**: When a real estate agent starts their career or switches brokerages, the first thing they do is sign up for Korella - because they know their business data will follow them throughout their career, accessible anywhere, and they'll never be held hostage by a CRM vendor again.

We win when agents say: "Korella is my business database. Everything else is just tools."
