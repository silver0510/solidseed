---
name: user-authentication
status: backlog
created: 2026-01-06T08:11:44Z
progress: 0%
prd: .claude/prds/user-authentication.md
github: [Will be updated when synced to GitHub]
---

# Epic: User Authentication System

## Overview

Implement a secure, mobile-first authentication system for Korella CRM using Better Auth library. The system will support email/password registration with email verification, Google and Microsoft OAuth social login, JWT-based session management, and comprehensive security features including account lockout, password reset, and authentication logging.

**Key Technology Decisions:**

- **Supabase** for PostgreSQL database hosting and management (with built-in tooling and migrations)
- **Better Auth** for authentication implementation (supports OAuth, email verification, session management)
- **JWT tokens** for stateless session management (3-day default, 30-day with "remember me")
- **Bcrypt** for password hashing (cost factor 12)
- **PostgreSQL via Supabase** for user data storage with 5 tables (users, oauth_providers, password_resets, email_verifications, auth_logs)

**Implementation Priority:** This is a critical path dependency for Client Hub - must be completed first to enable user access to all features.

---

## Architecture Decisions

### 1. Authentication Library: Better Auth

**Decision:** Use Better Auth library as the core authentication framework.

**Rationale:**

- Provides built-in support for OAuth (Google, Microsoft), email verification, and password management
- Handles JWT token generation and validation
- Supports rate limiting and security features out of the box
- Reduces custom code and security vulnerabilities
- Well-documented with active community support

**Trade-offs:**

- Learning curve for team unfamiliar with Better Auth
- Dependency on third-party library (mitigated by choosing established library)

### 2. Session Management: JWT Tokens (Stateless)

**Decision:** Use JWT tokens for session management without server-side session storage.

**Rationale:**

- **Scalability**: No server-side session store needed, enabling horizontal scaling
- **Performance**: Token validation doesn't require database lookup (< 100ms requirement)
- **Mobile-friendly**: Tokens stored client-side work seamlessly across mobile/desktop
- **Stateless**: Reduces infrastructure complexity

**Trade-offs:**

- Cannot invalidate individual tokens before expiration (mitigated by short expiration times)
- Token size larger than session IDs (mitigated by including only essential data)

**Token Contents:** user_id, email, subscription_tier, iat (issued at), exp (expiration)

### 3. Password Hashing: Bcrypt (Cost 12)

**Decision:** Use bcrypt with cost factor 12 for password hashing.

**Rationale:**

- Industry standard with proven security track record
- Built-in salting eliminates separate salt management
- Cost factor 12 balances security and performance (< 2 second login requirement)
- Better Auth supports bcrypt natively

**Alternative Considered:** Argon2 (more secure but requires additional setup)

### 4. Database: Supabase for PostgreSQL Management

**Decision:** Use Supabase for PostgreSQL database hosting, migrations, and management instead of self-hosted PostgreSQL.

**Rationale:**

- **Managed Infrastructure**: No need to provision/maintain PostgreSQL servers
- **Built-in Tooling**: Supabase Studio provides web UI for database management
- **Migration Support**: Supabase CLI for version-controlled database migrations
- **Automatic Backups**: Point-in-time recovery and automated backups included
- **Connection Pooling**: Built-in connection pooling (PgBouncer)
- **Performance**: Hosted on optimized infrastructure with monitoring
- **Cost-Effective**: Generous free tier, scales with usage

**Database Schema - Five Specialized Tables:**

1. `users` - core user accounts (15 fields)
2. `oauth_providers` - Google/Microsoft OAuth links
3. `password_resets` - temporary reset tokens (1-hour expiration)
4. `email_verifications` - temporary verification tokens (24-hour expiration)
5. `auth_logs` - authentication events (7-day retention)

**Benefits:**

- Separation of concerns (each table serves single purpose)
- Targeted indexes on each table optimize queries
- Easy to purge expired tokens/logs without affecting user data

### 5. OAuth Flow: Server-Side Token Exchange

**Decision:** Handle OAuth token exchange on backend, not client-side.

**Rationale:**

- **Security**: Client secret never exposed to client
- **Control**: Backend validates OAuth responses before creating user
- **Consistency**: Single point for user creation logic (email/password or OAuth)

**Flow:** Client → OAuth Provider → Callback to Backend → Backend exchanges code for token → Backend creates user/session

### 6. Email Verification: Required for Email/Password, Skipped for OAuth

**Decision:** Email verification mandatory for email/password registration, pre-verified for OAuth users.

**Rationale:**

- **Trust model**: Google/Microsoft already verified email addresses
- **UX**: OAuth users get immediate access (faster onboarding)
- **Security**: Email/password requires verification to prevent fake accounts

### 7. Rate Limiting: Redis for Distributed Rate Limiting

**Decision:** Use Redis (or in-memory fallback) for rate limit counters.

**Rationale:**

- **Performance**: In-memory counters provide sub-millisecond access
- **Distribution**: Redis enables rate limiting across multiple servers
- **Expiration**: Built-in TTL for automatic counter cleanup

**Limits:**

- Login attempts: 10 per minute per IP address
- Password reset: 3 per hour per email address

---

## Technical Approach

### Frontend Components

#### Authentication Pages (React/Vue/Next.js)

**1. Registration Page (`/register`)**

- Form with fields: Full Name, Email, Password, Confirm Password
- Real-time password strength indicator component
- Social login buttons (Google, Microsoft)
- Terms of Service and Privacy Policy checkboxes
- Validation: email format, password complexity (8+ chars, upper, lower, number, symbol)
- Success state: "Check your email to verify account"

**2. Login Page (`/login`)**

- Form with fields: Email, Password
- "Remember me" checkbox
- "Forgot password?" link
- Social login buttons (Google, Microsoft)
- Error states: invalid credentials, email not verified, account locked, account deactivated
- Redirect to dashboard on success

**3. Email Verification Page (`/verify-email`)**

- Token validation on page load
- Success state: "Email verified! Redirecting to login..."
- Error states: invalid token, expired token (with resend option)

**4. Password Reset Request Page (`/forgot-password`)**

- Form with field: Email
- Generic success message (security best practice)
- Rate limit error handling (3 per hour)

**5. Password Reset Page (`/reset-password`)**

- Token validation on page load
- Form with fields: New Password, Confirm Password
- Password strength indicator
- Success state: "Password reset! Redirecting to login..."
- Error states: invalid token, expired token, passwords don't match

**6. User Settings - Password Change**

- Form with fields: Current Password, New Password, Confirm Password
- Inline validation
- Success notification without logout

#### UI Components

**PasswordStrengthIndicator Component**

- Visual indicator (color bar: red → yellow → green)
- Text label: Weak, Medium, Strong
- Real-time update (< 200ms) using debounced validation
- Criteria display: length, uppercase, lowercase, number, symbol

**SocialLoginButton Component**

- Styled buttons with provider logos (Google, Microsoft)
- Loading state during OAuth redirect
- Error handling for OAuth failures

**AuthGuard Component (Route Protection)**

- Checks JWT token validity on protected routes
- Redirects to login if expired or missing
- Validates subscription tier for feature access

### Backend Services

#### API Endpoints (RESTful)

**POST /api/auth/register**

- Body: `{ full_name, email, password }`
- Validates email uniqueness, password complexity
- Hashes password with bcrypt (cost 12)
- Creates user record (status: pending_verification)
- Generates email verification token
- Sends verification email
- Returns: `{ message: "Check your email" }`

**POST /api/auth/verify-email**

- Query: `?token=xxx`
- Validates token, checks expiration
- Updates user: email_verified=true, status=active, trial_expires_at=now+14days
- Returns: `{ success: true, redirect: "/login" }`

**POST /api/auth/resend-verification**

- Body: `{ email }`
- Generates new verification token
- Sends verification email
- Returns: `{ message: "Verification email sent" }`

**POST /api/auth/login**

- Body: `{ email, password, remember_me }`
- Validates email exists, account active, email verified
- Verifies password hash
- Checks failed_login_count < 5
- Generates JWT token (3 or 30 day expiry)
- Logs login_success event
- Returns: `{ token, user: { id, email, full_name, subscription_tier } }`

**GET /api/auth/oauth/google**

- Redirects to Google OAuth consent screen
- Scopes: email, profile

**GET /api/auth/oauth/google/callback**

- Query: `?code=xxx`
- Exchanges code for Google access token
- Fetches user profile from Google
- Checks if user exists by email
- Creates user or links OAuth provider
- Generates JWT token
- Redirects to dashboard with token

**GET /api/auth/oauth/microsoft** (similar to Google)

**GET /api/auth/oauth/microsoft/callback** (similar to Google)

**POST /api/auth/forgot-password**

- Body: `{ email }`
- Rate limit: 3 per hour per email
- Generates password reset token
- Sends reset email
- Returns: `{ message: "If account exists, reset link sent" }`

**POST /api/auth/reset-password**

- Body: `{ token, new_password }`
- Validates token, checks expiration
- Updates password hash
- Marks token as used
- Invalidates all user sessions
- Sends confirmation email
- Returns: `{ success: true }`

**POST /api/auth/change-password** (Authenticated)

- Headers: `Authorization: Bearer <token>`
- Body: `{ current_password, new_password }`
- Validates current password
- Updates password hash
- Sends confirmation email
- Maintains current session
- Returns: `{ success: true }`

**POST /api/auth/logout** (Authenticated)

- Headers: `Authorization: Bearer <token>`
- Logs logout event
- Client-side: clears token from storage
- Returns: `{ success: true }`

**GET /api/auth/me** (Authenticated)

- Headers: `Authorization: Bearer <token>`
- Returns: `{ user: { id, email, full_name, subscription_tier, trial_expires_at } }`

#### JWT Middleware

**JWT Validation Middleware**

- Extracts token from `Authorization: Bearer <token>` header
- Verifies signature with secret key
- Checks expiration timestamp
- Validates user exists and is active
- Attaches user object to request context
- Returns 401 Unauthorized if invalid

#### Better Auth Configuration

**Better Auth Setup**

```typescript
// better-auth.config.ts
{
  database: {
    adapter: postgresAdapter({
      connectionString: process.env.SUPABASE_DATABASE_URL
    })
  },
  emailVerification: {
    enabled: true,
    tokenExpiration: 24 * 60 * 60, // 24 hours
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scopes: ['email', 'profile'],
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      scopes: ['email', 'profile'],
    },
  },
  session: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '3d', // default
    },
  },
  password: {
    bcrypt: {
      saltRounds: 12,
    },
    complexity: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
  },
  rateLimit: {
    login: { max: 10, window: 60 }, // 10 per minute
    passwordReset: { max: 3, window: 3600 }, // 3 per hour
  },
}
```

#### Security Features

**Account Lockout Logic**

- Track failed_login_count in users table
- Increment on failed password verification
- After 5 failures: set locked_until = now + 30 minutes
- Send security alert email
- Reset counter on successful login

**Rate Limiting Implementation**

- Use Redis counters with TTL
- Key format: `ratelimit:login:{ip_address}` or `ratelimit:reset:{email}`
- Increment on request, check before processing
- Return 429 Too Many Requests if exceeded

**Authentication Logging**

- Log all auth events to auth_logs table
- Events: login_success, login_fail, logout, password_reset, lockout
- Capture: user_id, event_type, ip_address, user_agent, created_at
- Background job: purge logs older than 7 days

### Infrastructure

#### Database Migrations (Supabase)

**Using Supabase CLI for migrations:**

```bash
# Initialize Supabase locally
supabase init

# Create new migration
supabase migration new create_users_table

# Apply migrations
supabase db push
```

**Migration 001: Create users table**

```sql
-- supabase/migrations/20260106_create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMP,
  account_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'trial',
  trial_expires_at TIMESTAMP,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_email_verified ON users(email_verified);
```

**Migrations 002-005:** Similar for oauth_providers, password_resets, email_verifications, auth_logs

**Supabase Benefits:**

- Version-controlled migrations in `supabase/migrations/` directory
- Migration history tracked automatically
- Rollback support via Supabase Studio
- Local development with `supabase start` (Docker-based)

#### Email Service Integration

**Email Templates Required:**

1. **Email Verification** - Welcome message with verification link
2. **Password Reset** - Reset link with 1-hour expiration notice
3. **Password Changed** - Confirmation notification
4. **Account Lockout** - Security alert with reset instructions

**Email Service Configuration:**

- Provider: SendGrid, Mailgun, or similar
- From address: noreply@korella.com (verified domain)
- Template variables: {user_name}, {verification_link}, {reset_link}, etc.
- Tracking: delivery status, open rates

#### Environment Variables

```bash
# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# JWT
JWT_SECRET=<secure-random-256-bit-key>

# OAuth - Google
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=https://app.korella.com/api/auth/oauth/google/callback

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=<from Azure Portal>
MICROSOFT_CLIENT_SECRET=<from Azure Portal>
MICROSOFT_REDIRECT_URI=https://app.korella.com/api/auth/oauth/microsoft/callback

# Email Service
EMAIL_SERVICE_API_KEY=<SendGrid/Mailgun API key>
EMAIL_FROM_ADDRESS=noreply@korella.com

# Rate Limiting
REDIS_URL=redis://localhost:6379 (optional, falls back to in-memory)

# App
APP_URL=https://app.korella.com
```

#### OAuth Provider Setup

**Google Cloud Console:**

1. Create OAuth 2.0 Client ID
2. Configure authorized redirect URIs
3. Enable Google+ API
4. Copy client ID and secret to env vars

**Microsoft Azure Portal:**

1. Register application in Azure AD
2. Configure redirect URIs
3. Add API permissions (email, profile)
4. Generate client secret
5. Copy client ID and secret to env vars

---

## Implementation Strategy

### Phase 1: Core Authentication (Week 1-2)

**Goal:** Email/password registration and login working end-to-end

**Tasks:**

1. Database schema setup (5 tables with migrations)
2. Better Auth configuration and integration
3. Email/password registration API endpoint
4. Email verification flow (send, verify, resend)
5. Email/password login API endpoint
6. JWT token generation and validation middleware
7. Basic frontend: registration, login, email verification pages

**Success Criteria:**

- User can register with email/password
- Email verification works (token sent, validated, expires after 24hrs)
- User can login with verified email
- JWT token issued and validated on protected routes
- Login response time < 2 seconds

### Phase 2: OAuth Social Login (Week 2)

**Goal:** Google and Microsoft OAuth working

**Tasks:**

1. OAuth provider registration (Google Cloud, Azure AD)
2. Google OAuth integration (Better Auth config)
3. Microsoft OAuth integration (Better Auth config)
4. OAuth callback handling and user creation/linking
5. Frontend: social login buttons on registration and login pages

**Success Criteria:**

- User can register/login with Google account
- User can register/login with Microsoft account
- OAuth flow completes in < 5 seconds
- Existing email/password users can link OAuth providers

### Phase 3: Security Features (Week 3)

**Goal:** Password reset, account lockout, and logging

**Tasks:**

1. Password reset request and completion API endpoints
2. Password reset email template
3. Account lockout logic (5 failed attempts → 30 min lock)
4. Security alert emails (lockout, password changed)
5. Authentication logging to auth_logs table
6. Background job for log purging (7-day retention)
7. Frontend: forgot password, reset password pages

**Success Criteria:**

- Password reset flow works end-to-end
- Account locks after 5 failed login attempts
- Security emails sent on lockout and password change
- All auth events logged to database
- Logs auto-purge after 7 days

### Phase 4: Session Management & Polish (Week 3-4)

**Goal:** Remember me, logout, password change, and UX polish

**Tasks:**

1. "Remember me" functionality (30-day JWT tokens)
2. Logout endpoint and client-side token clearing
3. Password change for authenticated users
4. Rate limiting (login, password reset)
5. Frontend: password strength indicator, loading states, error handling
6. Mobile-responsive design testing
7. Security testing (OWASP, penetration testing)

**Success Criteria:**

- "Remember me" extends session to 30 days
- Logout clears token and redirects to login
- Password change works without forced logout
- Rate limiting blocks excessive requests
- All forms work on mobile (375px width)
- No security vulnerabilities found in testing

---

## Task Breakdown Preview

High-level task categories for implementation:

**1. Database & Schema Setup**

- Create database migrations for 5 tables (users, oauth_providers, password_resets, email_verifications, auth_logs)
- Set up indexes for performance
- Configure database connection pooling

**2. Better Auth Integration**

- Install and configure Better Auth library
- Set up OAuth providers (Google, Microsoft)
- Configure email verification settings
- Configure JWT token settings
- Configure password hashing and complexity rules

**3. Authentication API Endpoints**

- Implement registration endpoint (email/password)
- Implement login endpoint (email/password)
- Implement OAuth endpoints (Google, Microsoft + callbacks)
- Implement email verification endpoints (verify, resend)
- Implement password management endpoints (forgot, reset, change)
- Implement session endpoints (logout, get current user)
- Create JWT validation middleware

**4. Security Features**

- Implement account lockout logic
- Implement rate limiting (Redis or in-memory)
- Implement authentication logging
- Set up background job for log purging
- Configure security alert emails

**5. Frontend Authentication UI**

- Build registration page with form validation
- Build login page with remember me option
- Build email verification page
- Build password reset pages (request + complete)
- Build password change UI in settings
- Create password strength indicator component
- Create social login button components
- Implement route guards for protected pages

**6. Email Integration**

- Set up email service (SendGrid/Mailgun)
- Create email templates (verification, reset, alerts)
- Configure email sending logic
- Test email deliverability

**7. OAuth Provider Setup**

- Register OAuth applications (Google Cloud, Azure AD)
- Configure redirect URIs
- Set up environment variables
- Test OAuth flows

**8. Testing & Security**

- Write unit tests for auth logic
- Write integration tests for API endpoints
- Perform security testing (OWASP)
- Test mobile responsiveness
- Load testing (100+ concurrent logins)
- Penetration testing

**9. Documentation & Deployment**

- Document environment variable setup
- Document OAuth provider registration steps
- Create deployment guide
- Set up monitoring and logging

**10. Trial Period & Subscription Integration**

- Implement trial period tracking (14 days)
- Integrate with subscription system for tier checking
- Handle subscription expiration (downgrade to free)
- Implement account deactivation logic

---

## Dependencies

### External Dependencies

**Must Be Ready Before Starting:**

1. ✅ Supabase project created and database provisioned
2. ✅ Supabase connection string obtained
3. ✅ Email service account (SendGrid/Mailgun) set up
4. ✅ Domain and SSL certificate for OAuth callbacks
5. ⏳ Google Cloud Platform account for OAuth
6. ⏳ Microsoft Azure account for OAuth

**Can Be Configured During Development:** 7. Redis for rate limiting (optional, in-memory fallback available) 8. Better Auth library documentation and examples 9. Supabase CLI installed for local development

### Internal Dependencies

**Blocks This Epic:**

- None (this is the first feature)

**This Epic Blocks:**

- Client Hub (requires authentication to access)
- All other features (require user login)

**Team Dependencies:**

1. **Design Team:** UI mockups for all authentication pages (registration, login, password reset, email verification)
2. **Legal Team:** Terms of Service and Privacy Policy documents
3. **DevOps Team:** OAuth provider setup, environment configuration, database provisioning
4. **QA Team:** Security testing plan, penetration testing resources

### Data Dependencies

1. **OAuth Client Credentials:** Must register apps with Google and Microsoft before OAuth implementation
2. **JWT Secret Key:** Generate secure 256-bit key for JWT signing
3. **Email Templates:** Content for verification, password reset, and security alert emails
4. **Email Sender Verification:** Domain verified with email service provider

---

## Success Criteria (Technical)

### Performance Benchmarks

1. ✅ **Login Response Time:** < 2 seconds (target: 1.5 seconds average)
2. ✅ **Registration Time:** < 3 seconds (target: 2.5 seconds average)
3. ✅ **OAuth Flow:** < 5 seconds (target: 4 seconds average)
4. ✅ **JWT Validation:** < 100ms per request
5. ✅ **Password Reset Email:** Sent within 5 seconds
6. ✅ **Concurrent Users:** Handle 100+ simultaneous logins without degradation

### Quality Gates

1. ✅ **Test Coverage:** > 80% code coverage for authentication logic
2. ✅ **Security Audit:** Zero critical vulnerabilities in penetration testing
3. ✅ **OWASP Compliance:** Pass OWASP authentication checklist
4. ✅ **Mobile UX:** All forms functional on 375px width screens
5. ✅ **Email Deliverability:** > 95% verification emails reach inbox
6. ✅ **OAuth Success Rate:** > 98% OAuth flows complete without errors

### Acceptance Criteria

**Registration Flow:**

- ✅ User can register with email/password
- ✅ Password strength indicator updates in real-time
- ✅ Verification email sent within 5 seconds
- ✅ Email verification link works for 24 hours
- ✅ User can resend verification email if expired
- ✅ User can register with Google OAuth
- ✅ User can register with Microsoft OAuth
- ✅ Trial period starts on email verification (14 days)

**Login Flow:**

- ✅ User can login with verified email/password
- ✅ User cannot login with unverified email
- ✅ User cannot login with deactivated account
- ✅ User can login with Google OAuth
- ✅ User can login with Microsoft OAuth
- ✅ "Remember me" extends session to 30 days
- ✅ JWT token issued on successful login
- ✅ User redirected to dashboard after login

**Security:**

- ✅ Account locks after 5 failed login attempts
- ✅ Security alert email sent on lockout
- ✅ Account unlocks after 30 minutes
- ✅ Passwords hashed with bcrypt (cost 12)
- ✅ JWT tokens signed with secure secret
- ✅ Rate limiting blocks excessive login attempts (10/min per IP)
- ✅ Rate limiting blocks excessive password resets (3/hr per email)
- ✅ All auth events logged to database
- ✅ Logs purged after 7 days

**Password Management:**

- ✅ User can request password reset
- ✅ Reset email sent within 5 seconds
- ✅ Reset token expires after 1 hour
- ✅ User can reset password with valid token
- ✅ All sessions invalidated after password reset
- ✅ Confirmation email sent after password change
- ✅ Authenticated user can change password
- ✅ Current session maintained after password change

**Session Management:**

- ✅ JWT token validates successfully
- ✅ Expired tokens rejected with 401
- ✅ User can logout (token cleared client-side)
- ✅ Protected routes redirect to login if not authenticated
- ✅ Subscription tier included in JWT token
- ✅ Expired subscription users downgraded to free tier

---

## Estimated Effort

### Overall Timeline

**Total Duration:** 3-4 weeks

**Week 1:** Core authentication (email/password registration and login)
**Week 2:** OAuth social login (Google, Microsoft)
**Week 3:** Security features (password reset, account lockout, logging)
**Week 4:** Polish, testing, and deployment

### Resource Requirements

**Backend Developer:** 1 full-time (3-4 weeks)

- Database schema and migrations
- Better Auth integration
- API endpoint implementation
- Security features (lockout, rate limiting, logging)

**Frontend Developer:** 1 full-time (2-3 weeks)

- Authentication pages (registration, login, password reset, verification)
- Form validation and password strength indicator
- Social login button integration
- Route guards and protected routes

**DevOps Engineer:** 0.5 part-time (1 week)

- OAuth provider setup (Google Cloud, Azure AD)
- Environment configuration
- Database provisioning
- Email service setup

**QA Engineer:** 0.5 part-time (1 week)

- Security testing (OWASP checklist)
- Penetration testing
- Mobile responsiveness testing
- Load testing

**Designer:** 0.25 part-time (few days)

- Authentication page mockups
- Password strength indicator design
- Social login button styling

### Critical Path Items

1. **Database Schema (Week 1, Day 1-2)** - Blocks all backend work
2. **Better Auth Integration (Week 1, Day 3-5)** - Blocks auth endpoints
3. **Email Service Setup (Week 1, parallel)** - Blocks email verification
4. **OAuth Provider Registration (Week 2, Day 1-2)** - Blocks OAuth implementation
5. **Security Testing (Week 4, Day 1-3)** - Must pass before deployment

### Risk Mitigation

**Risk 1: OAuth provider approval delays**

- Mitigation: Register OAuth apps early (Week 1)
- Contingency: Work on email/password auth while waiting

**Risk 2: Email deliverability issues**

- Mitigation: Use established email service (SendGrid/Mailgun)
- Contingency: Test deliverability early, adjust SPF/DKIM if needed

**Risk 3: Better Auth library limitations**

- Mitigation: Review Better Auth docs thoroughly before starting
- Contingency: Custom implementation for features Better Auth doesn't support

**Risk 4: Security vulnerabilities found**

- Mitigation: Follow OWASP guidelines, use established libraries
- Contingency: Budget extra time for security fixes in Week 4

---

## Monitoring & Observability

### Metrics to Track

**Authentication Events:**

- Registration attempts vs. completions (funnel)
- Email verification rate
- OAuth vs. email/password registration split
- Login success vs. failure rate
- Password reset requests
- Account lockouts

**Performance:**

- Login response time (p50, p95, p99)
- OAuth flow duration
- JWT validation latency
- Database query performance

**Security:**

- Failed login attempts per IP
- Account lockout frequency
- Password reset frequency
- Suspicious activity patterns

### Logging

**Application Logs:**

- All auth events (INFO level)
- Failed login attempts (WARN level)
- Account lockouts (WARN level)
- OAuth errors (ERROR level)
- Rate limit violations (WARN level)

**Database Logs:**

- All events stored in auth_logs table (7-day retention)
- Queryable for user-specific activity

### Alerts

**Critical:**

- OAuth provider downtime
- Email service failure
- Database connection errors
- JWT secret key compromise

**Warning:**

- High failed login rate (> 20% of attempts)
- High account lockout rate (> 2% of users)
- Slow login response time (> 3 seconds)
- Email deliverability drop (< 90%)

---

## Post-Launch Considerations

### Maintenance

**Regular Tasks:**

- Monitor authentication logs for suspicious patterns
- Review failed login rates and account lockouts
- Update OAuth client credentials before expiration
- Renew SSL certificates before expiration
- Update Better Auth library for security patches

**Performance Optimization:**

- Index optimization based on query patterns
- JWT token size reduction if needed
- Rate limiting tuning based on actual traffic

### Future Enhancements (Post-MVP)

**Phase 2 Features:**

1. Multi-Factor Authentication (MFA/2FA)
2. Device management (view/revoke sessions)
3. Login history in user profile
4. Additional OAuth providers (Apple, Facebook)
5. Magic link passwordless login
6. Biometric authentication (Face ID, Touch ID)
7. Enterprise SSO (SAML, LDAP)
8. Account deletion (GDPR self-service)

**Integration Opportunities:**

- Single sign-on with partner platforms
- Third-party identity providers
- Customer support chat integration
- Analytics platform integration

---

## References

### Documentation

- **Better Auth:** https://www.better-auth.com/docs
- **OAuth 2.0:** https://oauth.net/2/
- **JWT Best Practices:** https://tools.ietf.org/html/rfc8725
- **OWASP Auth Guide:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **Google OAuth:** https://developers.google.com/identity/protocols/oauth2
- **Microsoft OAuth:** https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

### Related PRDs

- **Client Hub:** .claude/prds/client-hub.md (depends on this epic)

---

## Tasks Created

- [ ] 001.md - Database Schema and Migrations Setup (parallel: false, foundational)
- [ ] 002.md - Better Auth Library Integration and Configuration (parallel: false, depends on 001)
- [ ] 003.md - Core Authentication API Endpoints (parallel: false, depends on 001, 002)
- [ ] 004.md - Password Management and Account Security (parallel: true, depends on 001, 002)
- [ ] 005.md - Session Management and Logout (parallel: true, depends on 003)
- [ ] 006.md - Frontend Authentication UI Components (parallel: true, depends on 003)
- [ ] 007.md - Email Service Integration and Templates (parallel: true, independent)
- [ ] 008.md - OAuth Provider Registration and Setup (parallel: true, independent)
- [ ] 009.md - Trial Period and Subscription Integration (parallel: true, depends on 003)
- [ ] 010.md - Testing, Security Audit, and Deployment (parallel: false, depends on all)

**Total tasks:** 10

**Parallel tasks:** 6 (Tasks 004-009 can run simultaneously with proper coordination)

**Sequential tasks:** 4 (Tasks 001, 002, 003, 010 must complete in order)

**Estimated total effort:** 112-140 hours

**Breakdown by size:**

- XS: 0 tasks
- S: 2 tasks (005, 008) - 10-14 hours
- M: 4 tasks (001, 002, 007, 009) - 32-42 hours
- L: 3 tasks (003, 004, 006) - 46-58 hours
- XL: 1 task (010) - 20-24 hours

**Critical path:** 001 → 002 → 003 → 010 (sequential backbone)

**Parallelization opportunity:** While task 003 is in development, tasks 004, 007, 008 can proceed simultaneously. Once 003 completes, tasks 005, 006, 009 can start in parallel.
