---
created: 2026-01-06T09:03:33Z
last_updated: 2026-01-06T09:03:33Z
version: 1.0
author: Claude Code PM System
---

# System Patterns & Architecture

## Architectural Style

### Mobile-First, Client-Server Architecture

**Core Principle**: Design for mobile (375px+ width) first, enhance for desktop.

**Rationale**: Real estate agents work primarily on mobile devices during property showings, open houses, and client meetings. Desktop access is secondary for detailed data entry and reporting.

**Implications:**
- Touch-friendly UI (44x44px minimum touch targets)
- Simplified navigation optimized for small screens
- Progressive enhancement for larger screens
- No horizontal scrolling on mobile
- Fast loading on cellular networks

### Data Access Patterns

**Soft Delete Pattern:**
- Never hard delete records
- Use `is_deleted` boolean flag
- Enables data recovery
- Supports audit trails
- GDPR compliant with export

```sql
-- Example soft delete
UPDATE clients SET is_deleted = true, updated_at = NOW()
WHERE id = 'client-uuid';

-- Query only active records
SELECT * FROM clients WHERE is_deleted = false;
```

**Tag-Based Organization:**
- Flexible, user-defined categorization
- Many-to-many relationship (clients ↔ tags)
- Enables multiple organizational schemes
- No rigid folder hierarchy
- Search by tags

```sql
-- Tags table structure
CREATE TABLE client_tags (
  client_id UUID REFERENCES clients(id),
  tag_name VARCHAR(100),
  PRIMARY KEY (client_id, tag_name)
);
```

## Authentication Patterns

### Token-Based Authentication (JWT)

**Pattern**: Stateless session management with JWT tokens.

**Flow:**
1. User authenticates → Server generates JWT
2. Client stores JWT (localStorage/sessionStorage)
3. Client sends JWT in Authorization header
4. Server validates JWT signature and expiration
5. Server extracts user_id and subscription_tier from token

**Token Structure:**
```javascript
{
  user_id: "uuid",
  email: "user@example.com",
  subscription_tier: "trial",  // or "free", "pro", "enterprise"
  iat: 1234567890,  // issued at
  exp: 1234827890   // expires
}
```

**Security Considerations:**
- Short-lived tokens (3 days default)
- Refresh tokens for "remember me" (30 days)
- No sensitive data in token payload
- HTTPS only (never over HTTP)
- Token invalidation on logout (future: maintain blacklist)

### OAuth Integration Pattern

**Pattern**: Server-side OAuth token exchange (not client-side).

**Rationale**:
- Prevents client secret exposure
- More secure than implicit flow
- Enables server-side user creation
- Supports session management

**Flow:**
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

**Benefits:**
- Client secret never exposed to browser
- Server controls user creation
- Can enrich user data before session creation

## Security Patterns

### Account Lockout Pattern

**Pattern**: Progressive lockout after failed login attempts.

**Implementation:**
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

**Reset Conditions:**
- Successful login
- Time expiration (30 minutes)
- Password reset

### Rate Limiting Pattern

**Pattern**: Request-based rate limiting per resource.

**Implementation:**
```
Login endpoint: 10 requests / minute / IP address
Password reset: 3 requests / hour / email address
```

**Benefits:**
- Prevents brute force attacks
- Reduces abuse
- Protects infrastructure

### Audit Logging Pattern

**Pattern**: Comprehensive event logging for security events.

**Events Logged:**
- Login success/failure
- Password reset request
- Email verification
- Account lockout
- OAuth authentication

**Log Retention:**
- 7 days in database (auto-purge)
- Longer retention in external logging service (optional)

**Schema:**
```sql
CREATE TABLE auth_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50),  -- login_success, login_fail, etc.
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP
);
```

## Data Management Patterns

### Trial Period Management

**Pattern**: Time-based trial with automatic downgrade.

**Implementation:**
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

**Business Logic:**
- Trial starts on email verification (not registration)
- 14 days from verification
- Auto-downgrade to free tier on expiration
- No credit card required for trial

### Subscription Tier Pattern

**Pattern**: Feature access control based on subscription tier.

**Tiers:**
- `trial` - Full access for 14 days
- `free` - Limited features
- `pro` - Full features (paid)
- `enterprise` - Advanced features (paid)

**Access Control:**
```typescript
// Middleware example
function requireSubscription(tier: string | string[]) {
  return (req, res, next) => {
    const userTier = req.user.subscription_tier;
    if (!allowedTiers.includes(userTier)) {
      return res.status(403).json({
        error: "Subscription upgrade required",
        current_tier: userTier,
        required_tier: tier
      });
    }
    next();
  };
}

// Usage
app.get('/api/advanced-feature',
  authenticateJWT,
  requireSubscription(['pro', 'enterprise']),
  handleAdvancedFeature
);
```

### Document Management Pattern

**Pattern**: Chronological document storage without categories.

**Design Decision**:
- Original plan: Custom document categories
- Current plan: Chronological only, sorted by `uploaded_at`
- Rationale: Simplify MVP, add categorization later if needed
- User can add description for context

**Schema:**
```sql
CREATE TABLE client_documents (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  file_name VARCHAR(255),
  file_size INTEGER,
  file_type VARCHAR(100),
  storage_path TEXT,
  description TEXT,  -- Optional user context
  uploaded_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false
);
```

**Access Pattern:**
```sql
-- Fetch documents for client (newest first)
SELECT * FROM client_documents
WHERE client_id = ? AND is_deleted = false
ORDER BY uploaded_at DESC;
```

## Database Patterns

### Migration Management

**Pattern**: Incremental, versioned SQL migrations via Supabase CLI.

**Structure:**
```
supabase/migrations/
  20260106000001_create_users_table.sql
  20260106000002_create_oauth_providers_table.sql
  20260106000003_create_password_resets_table.sql
  ...
```

**Naming Convention:**
- Timestamp prefix: `YYYYMMDDHHMMSS`
- Descriptive name: `create_table_name`
- Sequential numbering ensures order

**Best Practices:**
- One table per migration file
- Include rollback logic (future)
- Test migrations on development first
- Never modify existing migrations (create new ones)

### UUID Primary Keys

**Pattern**: UUID v4 for all primary keys (not auto-increment integers).

**Rationale:**
- Prevents enumeration attacks
- Enables distributed systems
- No collision risk across databases
- Better for public APIs

**Implementation:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
);
```

### Composite Unique Constraints

**Pattern**: Use composite unique constraints for logical uniqueness.

**Examples:**
```sql
-- OAuth providers: one provider per user per platform
CREATE UNIQUE INDEX oauth_providers_unique
ON oauth_providers(user_id, provider);

-- Client tags: one tag per client (no duplicates)
CREATE UNIQUE INDEX client_tags_unique
ON client_tags(client_id, tag_name);
```

### Timestamp Pattern

**Pattern**: Every table has `created_at` and `updated_at` timestamps.

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Benefits:**
- Audit trail
- Debugging
- Data analysis
- Chronological sorting

## API Design Patterns (Planned)

### RESTful Endpoints

**Pattern**: Resource-based URLs with HTTP verbs.

**Authentication Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-email
POST   /api/auth/resend-verification
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/oauth/google
GET    /api/auth/oauth/google/callback
GET    /api/auth/oauth/microsoft
GET    /api/auth/oauth/microsoft/callback
```

**Client Hub Endpoints (Future):**
```
GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id  (soft delete)
GET    /api/clients/:id/documents
POST   /api/clients/:id/documents
...
```

### Response Format Pattern

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }  // Optional
}
```

### Error Handling Pattern

**Pattern**: Consistent error codes and messages.

**Error Categories:**
- `VALIDATION_ERROR` - Invalid input
- `AUTH_ERROR` - Authentication failure
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT` - Too many requests
- `SERVER_ERROR` - Internal server error

## Frontend Patterns (To Be Defined)

**Pending Decisions:**
- Component library selection
- State management approach
- Form validation strategy
- Error boundary handling
- Loading state management

## Testing Patterns (Planned)

### Test Organization

**Pattern**: Mirror source code structure in tests.

```
tests/
  unit/
    auth/
      password-hashing.test.js
      jwt-generation.test.js
  integration/
    auth/
      registration-flow.test.js
      login-flow.test.js
      oauth-flow.test.js
  e2e/
    critical-paths.test.js
```

### Test Coverage Targets

- Unit tests: >80% coverage
- Integration tests: All critical flows
- E2E tests: Happy paths and error cases

## Project Management Patterns

### CCPM Workflow

**Pattern**: PRD → Epic → Tasks → Implementation.

**Workflow:**
1. Create PRD with `/pm:prd-new feature-name`
2. Convert to epic with `/pm:prd-parse feature-name`
3. Decompose to tasks with `/pm:epic-decompose feature-name`
4. Implement tasks sequentially or in parallel
5. Update task status as work progresses

### Frontmatter Standards

**Pattern**: All markdown files use YAML frontmatter with ISO 8601 timestamps.

```yaml
---
name: feature-name
status: open
created: 2026-01-06T09:03:33Z
updated: 2026-01-06T09:03:33Z
depends_on: [001, 002]
parallel: true
---
```

**Key Fields:**
- `created` - Never changes after creation
- `updated` - Modified on every change
- `depends_on` - Task dependencies
- `parallel` - Can run concurrently with other tasks

### Path Standards

**Pattern**: Always use relative paths, never expose local file structure.

**Correct:**
- `internal/auth/server.go`
- `../project-name/src/components/Button.tsx`

**Incorrect:**
- `/Users/username/project/internal/auth/server.go`
- `C:\Users\username\project\src\components\Button.tsx`

**Rationale:**
- Privacy protection
- Cross-platform compatibility
- Document portability
- No user-specific information in public docs

## Notes

- Patterns are defined but not yet implemented (planning phase)
- Frontend patterns pending framework selection
- API patterns will be refined during implementation
- Testing patterns will evolve with framework choice
