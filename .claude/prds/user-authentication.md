---
name: user-authentication
description: Secure user authentication system with email/password and social login (Google, Microsoft) for real estate agents
status: backlog
created: 2026-01-06T07:34:59Z
---

# PRD: User Authentication

## Executive Summary

The User Authentication system is the foundational security layer for Korella CRM, enabling real estate agents to securely register, login, and access their client management platform. This feature provides a frictionless yet secure authentication experience with multiple login options (email/password, Google, Microsoft) while maintaining strong security standards.

**Value Proposition**: Enable real estate professionals to quickly and securely access their CRM from any device, with minimal friction during registration and login, while maintaining enterprise-grade security standards.

**Key Differentiator**: Simple self-service registration with trial period access, combined with flexible social login options for faster onboarding, optimized for mobile-first usage.

---

## Problem Statement

### What problem are we solving?

Real estate agents need secure, reliable access to their client data without the complexity and friction of traditional enterprise authentication systems. Current problems include:

- **Registration barriers**: Complex sign-up processes that discourage new user adoption
- **Password fatigue**: Agents already manage multiple passwords across different platforms
- **Mobile access friction**: Difficult login experiences on mobile devices during showings
- **Security vs. convenience trade-off**: Strong security often comes at the cost of user experience
- **Account recovery challenges**: Forgotten passwords leading to support tickets and lost productivity

### Why is this important now?

1. **Client Hub Dependency**: User authentication must be ready before Client Hub launch - it's the gateway to all features
2. **Security First**: Real estate data is sensitive; proper authentication prevents unauthorized access to client information
3. **Trial Strategy**: Self-service registration with trial access is critical for user acquisition
4. **Mobile Reality**: Agents need quick, reliable mobile login during property showings and client meetings
5. **Competitive Expectation**: Modern SaaS applications are expected to support social login for faster onboarding
6. **Data Privacy Compliance**: GDPR and data protection regulations require proper user identity management

---

## User Stories

### Primary User Personas

**Persona 1: Sarah - New Agent Trying Korella**

- 35 years old, independent real estate agent
- Heard about Korella from colleague, wants to try it
- Uses Gmail for business communication
- Primarily works from iPhone during property showings
- Frustrated with lengthy registration processes
- Needs immediate access to evaluate the platform

**Persona 2: Michael - Experienced Agent Switching from Competitor**

- 42 years old, switching from FollowUpBoss
- Has 1,200+ clients to import
- Uses Microsoft 365 for business
- Security-conscious due to handling sensitive client data
- Needs reliable access from both desktop and mobile
- Expects professional-grade security

**Persona 3: Jennifer - Loan Officer Juggling Multiple Platforms**

- 38 years old, loan officer managing 800+ clients
- Already logged into Google on all her devices
- Frequently forgets passwords across multiple platforms
- Needs quick login to check client info during calls
- Values "remember me" functionality for convenience

### Detailed User Journeys

#### Journey 1: First-Time Registration with Email/Password

**Scenario**: Sarah discovers Korella and wants to sign up for a trial.

1. Sarah visits Korella landing page and clicks "Start Free Trial"
2. System displays registration form with fields: Name, Email, Password
3. Sarah enters her name and work email address
4. Sarah creates password (system shows strength indicator in real-time)
5. Sarah accepts terms of service and privacy policy
6. Sarah clicks "Create Account" button
7. System validates inputs, creates account, sends verification email
8. System displays message: "Check your email to verify your account"
9. Sarah opens email on her phone, clicks verification link
10. System verifies email, activates trial account
11. Sarah is redirected to logged-in dashboard
12. Trial period starts (14 days or as defined)

**Pain Points Addressed**:

- Quick registration process (under 2 minutes)
- Real-time password validation prevents submission errors
- Email verification ensures valid contact information
- Immediate trial access enables evaluation

#### Journey 2: Registration with Google OAuth

**Scenario**: Jennifer wants to sign up using her Google account for faster access.

1. Jennifer visits Korella and clicks "Start Free Trial"
2. System displays registration options: "Continue with Email" or "Continue with Google"
3. Jennifer clicks "Continue with Google"
4. System redirects to Google OAuth consent screen
5. Jennifer selects her Google work account
6. Google asks for permission to share profile info (name, email)
7. Jennifer approves access
8. Google redirects back to Korella with auth token
9. System creates account using Google email (already verified)
10. System displays brief profile completion form (if needed)
11. Jennifer completes profile and clicks "Get Started"
12. Jennifer is logged in, trial period starts

**Pain Points Addressed**:

- No password to remember (uses Google authentication)
- Instant email verification (Google email trusted)
- Faster registration (3 fields vs. traditional 8+ field forms)
- Single sign-on convenience

#### Journey 3: Login with Remember Me

**Scenario**: Michael logs in on his desktop and wants to stay logged in.

1. Michael visits Korella login page
2. System displays login form with email, password, and "Remember me" checkbox
3. Michael enters email and password
4. Michael checks "Remember me" checkbox
5. Michael clicks "Login" button
6. System validates credentials, creates session with extended expiration (30 days)
7. System stores secure session token in browser
8. Michael is redirected to dashboard
9. Michael closes browser and reopens 2 days later
10. Michael visits Korella - automatically logged in (session still valid)
11. Michael continues work without re-authentication

**Pain Points Addressed**:

- No need to login daily on trusted devices
- Seamless continuation of work across sessions
- Reduced password entry on mobile keyboards

#### Journey 4: Password Reset

**Scenario**: Sarah forgot her password and needs to reset it.

1. Sarah visits login page, clicks "Forgot password?"
2. System displays password reset form asking for email
3. Sarah enters her registered email address
4. Sarah clicks "Send Reset Link"
5. System validates email exists, sends password reset email
6. System displays: "If account exists, reset link sent to your email"
7. Sarah opens email, clicks reset link (valid for 1 hour)
8. System validates reset token, displays new password form
9. Sarah enters new password (meets complexity requirements)
10. Sarah confirms new password
11. System validates match, updates password hash
12. System displays success message: "Password updated successfully"
13. Sarah clicks "Login" and signs in with new password

**Pain Points Addressed**:

- Self-service password recovery (no support ticket needed)
- Secure token-based reset (limited time validity)
- Email-only verification (no security questions)

#### Journey 5: Account Lockout and Recovery

**Scenario**: Someone attempts to access Michael's account with wrong password.

1. Unauthorized person attempts login with Michael's email
2. Enters wrong password - System increments failed attempt counter
3. After 5th failed attempt, system locks account for 30 minutes
4. System sends security alert email to Michael: "Multiple failed login attempts detected"
5. Michael receives alert, clicks "This wasn't me" link
6. System prompts Michael to reset password immediately
7. Michael resets password following password reset flow
8. Account is unlocked with new password
9. Michael logs in successfully with new credentials

**Pain Points Addressed**:

- Brute force attack prevention
- User notification of suspicious activity
- Quick recovery path for legitimate user

---

## Requirements

### Functional Requirements

#### FR1: User Registration

**FR1.1: Email/Password Registration**

- **FR1.1.1**: System shall provide registration form with fields: Full Name (VARCHAR 255), Email (VARCHAR 255), Password (VARCHAR 255)
- **FR1.1.2**: System shall validate email format before submission
- **FR1.1.3**: System shall enforce unique constraint on email address
- **FR1.1.4**: System shall validate password meets complexity requirements (min 8 chars, uppercase, lowercase, number, symbol)
- **FR1.1.5**: System shall display real-time password strength indicator (Weak, Medium, Strong)
- **FR1.1.6**: System shall require acceptance of Terms of Service and Privacy Policy
- **FR1.1.7**: System shall hash passwords using bcrypt or argon2 before storage
- **FR1.1.8**: System shall create user account in pending verification state
- **FR1.1.9**: System shall send email verification link (valid for 24 hours)
- **FR1.1.10**: System shall display confirmation message: "Check your email to verify your account"
- **FR1.1.11**: System shall prevent login until email is verified

**FR1.2: Social Login Registration (Google)**

- **FR1.2.1**: System shall provide "Continue with Google" button on registration page
- **FR1.2.2**: System shall redirect to Google OAuth consent screen
- **FR1.2.3**: System shall request permissions: email, profile (name)
- **FR1.2.4**: System shall handle OAuth callback and validate authorization code
- **FR1.2.5**: System shall create user account with Google email (pre-verified)
- **FR1.2.6**: System shall store Google user ID for future OAuth logins
- **FR1.2.7**: System shall not require separate email verification for Google users
- **FR1.2.8**: System shall prompt for additional profile info if needed

**FR1.3: Social Login Registration (Microsoft)**

- **FR1.3.1**: System shall provide "Continue with Microsoft" button on registration page
- **FR1.3.2**: System shall redirect to Microsoft OAuth consent screen
- **FR1.3.3**: System shall request permissions: email, profile
- **FR1.3.4**: System shall handle OAuth callback and validate authorization code
- **FR1.3.5**: System shall create user account with Microsoft email (pre-verified)
- **FR1.3.6**: System shall store Microsoft user ID for future OAuth logins
- **FR1.3.7**: System shall not require separate email verification for Microsoft users

**FR1.4: Email Verification**

- **FR1.4.1**: System shall generate unique verification token for each registration
- **FR1.4.2**: System shall send verification email with clickable link
- **FR1.4.3**: System shall expire verification tokens after 24 hours
- **FR1.4.4**: System shall verify token on link click and activate account
- **FR1.4.5**: System shall display success message and redirect to login
- **FR1.4.6**: System shall allow resending verification email if expired
- **FR1.4.7**: System shall mark email as verified in user record

**FR1.5: Trial Account Setup**

- **FR1.5.1**: System shall assign trial subscription tier upon registration
- **FR1.5.2**: System shall set trial expiration date (14 days from registration)
- **FR1.5.3**: System shall grant full feature access during trial period
- **FR1.5.4**: System shall track trial status in user account

#### FR2: User Login

**FR2.1: Email/Password Login**

- **FR2.1.1**: System shall provide login form with fields: Email, Password
- **FR2.1.2**: System shall validate credentials against stored user records
- **FR2.1.3**: System shall verify password hash using bcrypt/argon2
- **FR2.1.4**: System shall check if email is verified before allowing login
- **FR2.1.5**: System shall check if account is active (not deactivated)
- **FR2.1.6**: System shall generate JWT token upon successful authentication
- **FR2.1.7**: System shall set JWT token expiration to 3 days
- **FR2.1.8**: System shall return JWT token to client for subsequent API requests
- **FR2.1.9**: System shall redirect to dashboard upon successful login
- **FR2.1.10**: System shall display appropriate error messages for failed login

**FR2.2: Social Login (Google)**

- **FR2.2.1**: System shall provide "Continue with Google" button on login page
- **FR2.2.2**: System shall initiate Google OAuth flow
- **FR2.2.3**: System shall validate Google user ID against stored records
- **FR2.2.4**: System shall generate JWT token for authenticated Google user
- **FR2.2.5**: System shall handle first-time Google login as registration

**FR2.3: Social Login (Microsoft)**

- **FR2.3.1**: System shall provide "Continue with Microsoft" button on login page
- **FR2.3.2**: System shall initiate Microsoft OAuth flow
- **FR2.3.3**: System shall validate Microsoft user ID against stored records
- **FR2.3.4**: System shall generate JWT token for authenticated Microsoft user
- **FR2.3.5**: System shall handle first-time Microsoft login as registration

**FR2.4: Remember Me Functionality**

- **FR2.4.1**: System shall provide "Remember me" checkbox on login form
- **FR2.4.2**: System shall extend JWT token expiration to 30 days when checked
- **FR2.4.3**: System shall store extended session securely in browser
- **FR2.4.4**: System shall maintain session across browser restarts
- **FR2.4.5**: System shall allow manual logout to clear remembered session

**FR2.5: Login Security**

- **FR2.5.1**: System shall track failed login attempts per email address
- **FR2.5.2**: System shall lock account for 30 minutes after 5 failed attempts
- **FR2.5.3**: System shall send security alert email on account lockout
- **FR2.5.4**: System shall reset failed attempt counter on successful login
- **FR2.5.5**: System shall log all login attempts (user_id, IP address, timestamp)
- **FR2.5.6**: System shall retain login logs for 1 week

#### FR3: Password Management

**FR3.1: Password Reset Request**

- **FR3.1.1**: System shall provide "Forgot password?" link on login page
- **FR3.1.2**: System shall display password reset form requesting email
- **FR3.1.3**: System shall generate unique password reset token
- **FR3.1.4**: System shall send password reset email with reset link
- **FR3.1.5**: System shall expire reset tokens after 1 hour
- **FR3.1.6**: System shall display generic message regardless of email existence (security)
- **FR3.1.7**: System shall limit reset requests to 3 per hour per email (rate limiting)

**FR3.2: Password Reset Completion**

- **FR3.2.1**: System shall validate reset token on link click
- **FR3.2.2**: System shall display new password form if token valid
- **FR3.2.3**: System shall require password confirmation (match validation)
- **FR3.2.4**: System shall enforce password complexity requirements
- **FR3.2.5**: System shall update password hash in user record
- **FR3.2.6**: System shall invalidate reset token after successful reset
- **FR3.2.7**: System shall send confirmation email: "Your password was changed"
- **FR3.2.8**: System shall invalidate all existing sessions (force re-login)
- **FR3.2.9**: System shall redirect to login page with success message

**FR3.3: Password Change (Authenticated User)**

- **FR3.3.1**: System shall provide password change form in user settings
- **FR3.3.2**: System shall require current password for verification
- **FR3.3.3**: System shall require new password meeting complexity requirements
- **FR3.3.4**: System shall require new password confirmation
- **FR3.3.5**: System shall update password hash after validation
- **FR3.3.6**: System shall send confirmation email
- **FR3.3.7**: System shall maintain current session (no forced logout)

#### FR4: Session Management

**FR4.1: JWT Token Management**

- **FR4.1.1**: System shall generate JWT token with user_id, email, subscription_tier
- **FR4.1.2**: System shall sign JWT tokens with secret key
- **FR4.1.3**: System shall set default token expiration to 3 days
- **FR4.1.4**: System shall set extended token expiration to 30 days for "remember me"
- **FR4.1.5**: System shall validate JWT token on each API request
- **FR4.1.6**: System shall reject expired or invalid tokens
- **FR4.1.7**: System shall return 401 Unauthorized for invalid tokens

**FR4.2: Session Lifecycle**

- **FR4.2.1**: System shall create session on successful login
- **FR4.2.2**: System shall extend session on user activity (if remember me enabled)
- **FR4.2.3**: System shall expire session after inactivity period (3 days default)
- **FR4.2.4**: System shall terminate session on explicit logout
- **FR4.2.5**: System shall terminate all sessions on password change/reset
- **FR4.2.6**: System shall redirect to login page on session expiration

**FR4.3: Logout**

- **FR4.3.1**: System shall provide logout button in user interface
- **FR4.3.2**: System shall invalidate JWT token on logout
- **FR4.3.3**: System shall clear session from browser storage
- **FR4.3.4**: System shall redirect to login page
- **FR4.3.5**: System shall log logout event (user_id, timestamp)

#### FR5: Account Status Management

**FR5.1: Account Activation States**

- **FR5.1.1**: System shall support account states: pending_verification, active, deactivated, locked
- **FR5.1.2**: System shall set new accounts to pending_verification state
- **FR5.1.3**: System shall change to active state on email verification
- **FR5.1.4**: System shall change to locked state after failed login threshold
- **FR5.1.5**: System shall prevent login for deactivated accounts
- **FR5.1.6**: System shall display appropriate message for each account state

**FR5.2: Subscription-Based Access**

- **FR5.2.1**: System shall check subscription status on login
- **FR5.2.2**: System shall allow login for users with expired subscription
- **FR5.2.3**: System shall downgrade expired users to free tier upon login
- **FR5.2.4**: System shall block login for deactivated accounts
- **FR5.2.5**: System shall display subscription status in user profile

**FR5.3: Account Deactivation**

- **FR5.3.1**: System shall support account deactivation (soft delete)
- **FR5.3.2**: System shall prevent login for deactivated accounts
- **FR5.3.3**: System shall display message: "Account deactivated. Contact support."
- **FR5.3.4**: System shall retain user data when deactivated (for reactivation)
- **FR5.3.5**: System shall allow admin to reactivate accounts

#### FR6: Security & Logging

**FR6.1: Authentication Logging**

- **FR6.1.1**: System shall log all login attempts with user_id, IP address, timestamp
- **FR6.1.2**: System shall log all logout events
- **FR6.1.3**: System shall log all password reset requests
- **FR6.1.4**: System shall log all failed authentication attempts
- **FR6.1.5**: System shall log account lockouts
- **FR6.1.6**: System shall retain logs for 1 week
- **FR6.1.7**: System shall purge logs older than 1 week

**FR6.2: Security Alerts**

- **FR6.2.1**: System shall send email alert on account lockout
- **FR6.2.2**: System shall send email alert on password reset
- **FR6.2.3**: System shall send email alert on password change
- **FR6.2.4**: System shall send email on new device login (future enhancement)

### Non-Functional Requirements

#### NFR1: Performance

**NFR1.1**: Login response time shall not exceed 2 seconds
**NFR1.2**: Registration shall complete within 3 seconds
**NFR1.3**: OAuth redirect flow shall complete within 5 seconds
**NFR1.4**: Password reset email shall be sent within 5 seconds
**NFR1.5**: JWT token validation shall complete within 100ms
**NFR1.6**: System shall handle 100+ concurrent login requests without degradation

#### NFR2: Security

**NFR2.1**: Passwords shall be hashed using bcrypt (cost factor 12) or argon2
**NFR2.2**: JWT tokens shall be signed using HS256 or RS256 algorithm
**NFR2.3**: Password reset tokens shall be cryptographically random (256-bit)
**NFR2.4**: System shall protect against SQL injection attacks
**NFR2.5**: System shall protect against XSS attacks
**NFR2.6**: System shall protect against CSRF attacks
**NFR2.7**: System shall use HTTPS for all authentication requests
**NFR2.8**: System shall implement rate limiting (10 requests/minute per IP for login)
**NFR2.9**: System shall implement rate limiting (3 requests/hour for password reset)
**NFR2.10**: OAuth tokens shall be stored encrypted at rest

#### NFR3: Availability & Reliability

**NFR3.1**: Authentication system shall maintain 99.9% uptime
**NFR3.2**: System shall handle authentication service failures gracefully
**NFR3.3**: OAuth provider failures shall not crash the application
**NFR3.4**: System shall provide clear error messages for all failure scenarios
**NFR3.5**: System shall implement automatic retry for transient failures

#### NFR4: Scalability

**NFR4.1**: System shall support 10,000+ registered users
**NFR4.2**: System shall support 1,000+ concurrent sessions
**NFR4.3**: Database shall support horizontal scaling for user table
**NFR4.4**: JWT token validation shall not require database lookup for each request

#### NFR5: Usability

**NFR5.1**: Registration shall be completable on mobile in under 2 minutes
**NFR5.2**: Login form shall be accessible on screens as small as 375px width
**NFR5.3**: Password strength indicator shall update in real-time (< 200ms)
**NFR5.4**: Error messages shall be clear and actionable
**NFR5.5**: Social login buttons shall be prominently displayed
**NFR5.6**: System shall support autofill for email and password fields

#### NFR6: Compliance

**NFR6.1**: System shall comply with OWASP authentication best practices
**NFR6.2**: System shall log only necessary data for authentication (user_id, IP, timestamp)
**NFR6.3**: System shall not log passwords or tokens
**NFR6.4**: System shall implement secure session management per OWASP guidelines
**NFR6.5**: OAuth implementation shall follow OAuth 2.0 specification

---

## Success Criteria

### Primary Metrics

**Target**: Achieve 90%+ registration completion rate and 95%+ login success rate within first month of launch.

**Measurement Approach**:

- Track registration funnel: started → email verified → first login
- Monitor login success rate: successful logins / total attempts
- Track password reset frequency: resets per user per month
- Monitor failed login attempts and account lockouts

### Secondary Metrics

**Adoption and Usage**:

1. **Registration Completion**: 90% of users who start registration complete email verification
2. **Social Login Adoption**: 40% of new users register via Google or Microsoft
3. **Remember Me Usage**: 60% of users enable "remember me" option
4. **Login Success Rate**: 95% of login attempts succeed on first try

**Security Metrics**: 5. **Account Lockouts**: Less than 1% of accounts locked per week 6. **Password Reset Frequency**: Less than 5% of users reset password per month 7. **Suspicious Activity**: Zero successful unauthorized access attempts 8. **Session Security**: No session hijacking incidents

**Performance Metrics**: 9. **Login Speed**: Average login time under 1.5 seconds 10. **OAuth Performance**: Average OAuth flow completion under 4 seconds

**User Experience**: 11. **Password Strength**: 80% of passwords rated "Strong" on registration 12. **Mobile Login**: 70% of logins occur on mobile devices 13. **User Satisfaction**: System Usability Scale (SUS) score of 80+ for authentication flow

---

## Constraints & Assumptions

### Technical Constraints

1. **Database**: Must use Supabase for PostgreSQL database and management
2. **Authentication Library**: Must use Better Auth library as specified
3. **Token Format**: JWT tokens only (no server-side session store)
4. **Password Hashing**: Bcrypt or Argon2 only (no MD5, SHA1)
5. **OAuth Providers**: Google and Microsoft only in MVP (no Facebook, Apple)
6. **Browser Support**: Modern browsers only (Chrome, Safari, Firefox, Edge - last 2 versions)
7. **Mobile OS**: iOS 14+ and Android 10+

### Business Constraints

1. **Timeline**: Must launch before Client Hub (dependency)
2. **Trial Period**: 14-day trial for all new registrations
3. **Admin Dashboard**: Separate authentication system for admin (out of scope)
4. **Cost**: OAuth integration costs must fit within budget

### Resource Constraints

1. **Email Service**: Must use existing email service (SendGrid, Mailgun, etc.)
2. **Development Team**: Limited to current team size
3. **Testing**: Manual testing for OAuth flows (automated testing limited)

### Assumptions

1. **Supabase Availability**: Supabase service maintains 99.9% uptime
2. **Better Auth Support**: Better Auth library supports Supabase PostgreSQL adapter
3. **Email Deliverability**: 95%+ of verification emails reach inbox (not spam)
4. **OAuth Provider Availability**: Google and Microsoft OAuth services maintain 99.9% uptime
5. **User Email Access**: Users have access to their email during registration
6. **Browser Compatibility**: Users have JavaScript enabled
7. **Network Connectivity**: Users have stable internet connection (4G or better)
8. **Email Uniqueness**: One email = one account (no shared emails)
9. **Trial to Paid Conversion**: 20% of trial users convert to paid subscription
10. **User Behavior**: Users prefer social login over email/password (60/40 split)
11. **Security Awareness**: Users understand basic password security concepts

---

## Out of Scope

### Explicitly NOT Building in Initial Release

1. **Multi-Factor Authentication (MFA)**: Two-factor authentication deferred to future release
2. **Enterprise SSO**: SAML, LDAP, Active Directory integration is future enhancement
3. **Biometric Authentication**: Face ID, Touch ID, fingerprint authentication not in MVP
4. **Magic Link Login**: Passwordless email link authentication is out of scope
5. **Phone Number Authentication**: SMS-based verification not in MVP
6. **Social Login Providers**: Facebook, Apple, LinkedIn, Twitter not in MVP
7. **Account Linking**: Linking multiple OAuth providers to same account is future
8. **Admin User Authentication**: Separate admin authentication system (different PRD)
9. **API Key Management**: API keys for third-party integrations is out of scope
10. **Device Management**: View/manage logged-in devices is future enhancement
11. **Session Management UI**: User interface to view/terminate active sessions
12. **Login History**: Detailed login history in user profile is future
13. **Passwordless Authentication**: WebAuthn, passkeys not in MVP
14. **Custom Password Policies**: Org-specific password requirements (future for multi-tenancy)
15. **Account Deletion**: Self-service account deletion is future (GDPR requirement)
16. **Username Login**: Email-only login (no custom usernames)
17. **Security Questions**: Password recovery via security questions not supported
18. **Login Notifications**: Email on every login is too noisy (only suspicious activity)

---

## Dependencies

### External Dependencies

1. **Supabase**: Database hosting, management, and tooling (PostgreSQL-based)
2. **Better Auth Library**: Third-party authentication library for implementation
3. **Google OAuth**: Google Cloud Platform OAuth 2.0 API
4. **Microsoft OAuth**: Microsoft Azure AD OAuth 2.0 API
5. **Email Service**: SendGrid, Mailgun, or similar for transactional emails
6. **Domain & SSL**: Verified domain and SSL certificate for OAuth callbacks

### Internal Dependencies

1. **Email Templates**: Designed email templates for verification, password reset, security alerts
2. **Frontend Framework**: Authentication UI components integrated with frontend
3. **API Framework**: RESTful API or GraphQL endpoints for authentication
4. **User Table**: Database schema for users, sessions, oauth_providers
5. **Subscription System**: Integration with subscription management for tier checking
6. **Admin Dashboard**: Separate system for admin user management (uses different auth)

### Team Dependencies

1. **Design Team**: UI/UX designs for registration, login, password reset flows
2. **Frontend Team**: Implementation of authentication forms and OAuth flows
3. **Backend Team**: API endpoints, JWT token generation, password hashing
4. **DevOps Team**: OAuth provider setup, SSL certificates, environment configuration
5. **Legal Team**: Terms of Service and Privacy Policy for registration
6. **QA Team**: Security testing, penetration testing, OAuth flow testing
7. **Email Team**: Transactional email templates and deliverability setup

### Data Dependencies

1. **OAuth Client IDs**: Registered OAuth apps with Google and Microsoft
2. **JWT Secret Key**: Secure secret key for signing JWT tokens
3. **Email Sender**: Verified email sender address for authentication emails
4. **Rate Limit Configuration**: IP-based rate limiting rules

---

## Database Schema

### users

| Field Name         | Type         | Allow Null | Description                     | Validation Rule                            |
| ------------------ | ------------ | ---------- | ------------------------------- | ------------------------------------------ |
| id                 | UUID         | No         | Primary key identifier          | Auto-generated UUID                        |
| email              | VARCHAR(255) | No         | User email address              | Required, valid email format, unique       |
| password_hash      | VARCHAR(255) | Yes        | Hashed password (bcrypt/argon2) | Null for OAuth-only users                  |
| full_name          | VARCHAR(255) | No         | User full name                  | Required, min 1 character                  |
| email_verified     | BOOLEAN      | No         | Email verification status       | Default: false                             |
| email_verified_at  | TIMESTAMP    | Yes        | Email verification timestamp    | Set when verified                          |
| account_status     | VARCHAR(50)  | No         | Account status                  | Enum: pending, active, deactivated, locked |
| subscription_tier  | VARCHAR(50)  | No         | Current subscription tier       | Enum: trial, free, pro, enterprise         |
| trial_expires_at   | TIMESTAMP    | Yes        | Trial expiration date           | Set for trial users                        |
| failed_login_count | INTEGER      | No         | Failed login attempt counter    | Default: 0, reset on success               |
| locked_until       | TIMESTAMP    | Yes        | Account lock expiration         | Set after 5 failed attempts                |
| last_login_at      | TIMESTAMP    | Yes        | Last successful login timestamp | Updated on each login                      |
| last_login_ip      | VARCHAR(45)  | Yes        | Last login IP address           | IPv4 or IPv6                               |
| created_at         | TIMESTAMP    | No         | Account creation timestamp      | Auto-generated                             |
| updated_at         | TIMESTAMP    | No         | Last update timestamp           | Auto-updated                               |

**Indexes**:

- Primary Key: `id`
- Unique: `email`
- Index: `account_status`, `subscription_tier`, `email_verified`

### oauth_providers

| Field Name  | Type         | Allow Null | Description               | Validation Rule               |
| ----------- | ------------ | ---------- | ------------------------- | ----------------------------- |
| id          | UUID         | No         | Primary key identifier    | Auto-generated UUID           |
| user_id     | UUID         | No         | Reference to users table  | Foreign key to users.id       |
| provider    | VARCHAR(50)  | No         | OAuth provider name       | Enum: google, microsoft       |
| provider_id | VARCHAR(255) | No         | Provider's user ID        | Required, unique per provider |
| email       | VARCHAR(255) | No         | Email from OAuth provider | Required                      |
| created_at  | TIMESTAMP    | No         | Link creation timestamp   | Auto-generated                |
| updated_at  | TIMESTAMP    | No         | Last update timestamp     | Auto-updated                  |

**Indexes**:

- Primary Key: `id`
- Composite Unique: `provider`, `provider_id`
- Index: `user_id`

### password_resets

| Field Name | Type         | Allow Null | Description              | Validation Rule                  |
| ---------- | ------------ | ---------- | ------------------------ | -------------------------------- |
| id         | UUID         | No         | Primary key identifier   | Auto-generated UUID              |
| user_id    | UUID         | No         | Reference to users table | Foreign key to users.id          |
| token      | VARCHAR(255) | No         | Reset token (hashed)     | Unique, cryptographically random |
| expires_at | TIMESTAMP    | No         | Token expiration         | 1 hour from creation             |
| used       | BOOLEAN      | No         | Token used status        | Default: false                   |
| created_at | TIMESTAMP    | No         | Request timestamp        | Auto-generated                   |

**Indexes**:

- Primary Key: `id`
- Unique: `token`
- Index: `user_id`, `expires_at`

### email_verifications

| Field Name | Type         | Allow Null | Description              | Validation Rule                  |
| ---------- | ------------ | ---------- | ------------------------ | -------------------------------- |
| id         | UUID         | No         | Primary key identifier   | Auto-generated UUID              |
| user_id    | UUID         | No         | Reference to users table | Foreign key to users.id          |
| token      | VARCHAR(255) | No         | Verification token       | Unique, cryptographically random |
| expires_at | TIMESTAMP    | No         | Token expiration         | 24 hours from creation           |
| verified   | BOOLEAN      | No         | Verification status      | Default: false                   |
| created_at | TIMESTAMP    | No         | Request timestamp        | Auto-generated                   |

**Indexes**:

- Primary Key: `id`
- Unique: `token`
- Index: `user_id`

### auth_logs

| Field Name | Type        | Allow Null | Description             | Validation Rule                                                  |
| ---------- | ----------- | ---------- | ----------------------- | ---------------------------------------------------------------- |
| id         | UUID        | No         | Primary key identifier  | Auto-generated UUID                                              |
| user_id    | UUID        | Yes        | User who attempted auth | Foreign key to users.id (null for failed attempts)               |
| event_type | VARCHAR(50) | No         | Type of auth event      | Enum: login_success, login_fail, logout, password_reset, lockout |
| ip_address | VARCHAR(45) | No         | Request IP address      | IPv4 or IPv6                                                     |
| user_agent | TEXT        | Yes        | Browser user agent      | Optional                                                         |
| created_at | TIMESTAMP   | No         | Event timestamp         | Auto-generated                                                   |

**Indexes**:

- Primary Key: `id`
- Index: `user_id`, `created_at`, `event_type`
- Retention: 7 days (auto-purge older records)

---

## Business Rules

1. **Email Uniqueness**: Each email address can only be associated with one user account. Social logins with same email link to existing account.

2. **Password Security**: Passwords must meet minimum requirements (8+ chars, uppercase, lowercase, number, symbol) and must be hashed using bcrypt (cost 12) or argon2 before storage.

3. **Email Verification Required**: Users cannot login until email is verified, except for OAuth users whose email is pre-verified by the provider.

4. **Account Lockout Policy**: After 5 consecutive failed login attempts, account is locked for 30 minutes. Lockout counter resets on successful login.

5. **Trial Period**: All new registrations start with 14-day trial with full feature access. Trial period begins immediately upon email verification.

6. **Session Expiration**: Default JWT tokens expire after 3 days. "Remember me" extends expiration to 30 days. All sessions invalidated on password change.

7. **Subscription Status**: Users with expired subscriptions are downgraded to free tier but can still login. Deactivated users cannot login.

8. **Password Reset Tokens**: Reset tokens expire after 1 hour and can only be used once. Rate limited to 3 requests per hour per email.

9. **OAuth Provider Linking**: If user registers with email/password and later logs in with OAuth using same email, accounts are merged (OAuth provider linked to existing account).

10. **Security Logging**: All authentication events (login, logout, password reset, failed attempts) are logged with user_id, IP address, and timestamp for 7 days.

11. **Rate Limiting**: Login attempts limited to 10 per minute per IP address. Password reset requests limited to 3 per hour per email.

12. **Token Security**: JWT tokens must be signed with secure secret key. Tokens include user_id, email, subscription_tier. No sensitive data in token payload.

13. **Account States**: Users progress through states: pending_verification → active. Can be moved to deactivated or locked states based on actions.

14. **Concurrent Sessions**: Users can have multiple active sessions across devices. All sessions share same JWT token expiration policy.

15. **Data Retention**: Authentication logs retained for 7 days. Unused password reset tokens purged after expiration. Unused email verification tokens purged after 7 days.

---

## Technical Architecture Considerations

### Authentication Flow

**Email/Password Registration:**

1. User submits registration form
2. Backend validates input, checks email uniqueness
3. Backend hashes password (bcrypt cost 12)
4. Backend creates user record (status: pending_verification)
5. Backend generates verification token, sends email
6. User clicks verification link
7. Backend validates token, updates status to active
8. User can now login

**OAuth Registration/Login:**

1. User clicks "Continue with Google/Microsoft"
2. Frontend redirects to OAuth provider
3. Provider shows consent screen
4. User approves, provider redirects with auth code
5. Backend exchanges code for access token
6. Backend fetches user profile from provider
7. Backend checks if email exists in users table
8. If new: create user (email_verified=true, status=active)
9. If existing: link OAuth provider to user
10. Backend generates JWT token
11. User is logged in

**Login Flow:**

1. User submits login credentials
2. Backend validates email exists
3. Backend checks account status (active, verified)
4. Backend verifies password hash
5. Backend checks failed login counter (< 5)
6. Backend generates JWT token (3 or 30 day expiry)
7. Backend logs successful login event
8. Backend returns JWT token to frontend
9. Frontend stores token in localStorage/cookie
10. Frontend redirects to dashboard

### Security Implementation

**Password Hashing:**

- Use bcrypt with cost factor 12 (or argon2)
- Salt automatically handled by bcrypt
- Never store plaintext passwords

**JWT Token Structure:**

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "subscription_tier": "trial",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Validation:**

- Verify signature using secret key
- Check expiration timestamp
- Validate user still exists and is active
- Check subscription tier hasn't changed (optional refresh)

**Rate Limiting:**

- Use Redis or in-memory store for rate limit counters
- Track by IP address for login attempts
- Track by email for password reset requests

---

## Future Enhancements (Post-MVP)

1. Multi-Factor Authentication (MFA/2FA)
2. Enterprise SSO (SAML, LDAP)
3. Biometric authentication (Face ID, Touch ID)
4. Magic link (passwordless) login
5. Phone number authentication (SMS verification)
6. Additional OAuth providers (Apple, Facebook, LinkedIn)
7. Account linking (multiple OAuth providers per account)
8. Device management (view/revoke active sessions)
9. Login history in user profile
10. Security dashboard with login activity
11. WebAuthn / Passkey support
12. Custom password policies (for organizations)
13. Account deletion (self-service GDPR compliance)
14. Login notifications (email on new device)
15. Suspicious activity detection (unusual location, device)
16. Admin impersonation (support access to user account)
17. IP whitelist/blacklist for account access
18. OAuth scope management (granular permissions)

---

## Appendix

### Glossary

- **OAuth**: Open Authorization protocol for delegated access
- **JWT**: JSON Web Token for stateless authentication
- **Bcrypt**: Password hashing algorithm with built-in salt
- **Argon2**: Modern password hashing algorithm (more secure than bcrypt)
- **Rate Limiting**: Restricting number of requests in a time period
- **Session**: Period of authenticated user activity
- **Token**: Cryptographically secure string for authentication/verification
- **Account Lockout**: Temporary block on login after failed attempts
- **Social Login**: Authentication using third-party provider (Google, Microsoft)

### References

- Better Auth: https://www.better-auth.com/
- OAuth 2.0 Specification: https://oauth.net/2/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
- Microsoft OAuth 2.0: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

### Revision History

- 2026-01-06: Initial PRD created
