---
created: 2026-01-06T09:03:33Z
last_updated: 2026-01-06T09:03:33Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Overview

This guide establishes coding standards, documentation conventions, and style preferences for the SolidSeed CRM project. These standards ensure consistency, maintainability, and quality across all project artifacts.

## Documentation Standards

### Markdown Files

**File Naming:**

- Use lowercase with hyphens: `user-authentication.md`
- Be descriptive but concise: `project-brief.md` not `project.md`
- Use consistent suffixes: `-analysis.md`, `-status.md`

**Frontmatter (Required):**

```yaml
---
name: feature-name
status: open | in-progress | completed
created: 2026-01-06T09:03:33Z # ISO 8601 UTC
updated: 2026-01-06T09:03:33Z # ISO 8601 UTC
depends_on: [001, 002] # Optional: task dependencies
parallel: true # Optional: can run concurrently
---
```

**Heading Hierarchy:**

```markdown
# H1 - Document Title (only one per file)

## H2 - Major Sections

### H3 - Subsections

#### H4 - Minor Subsections (use sparingly)
```

**Lists:**

- Use `-` for unordered lists (not `*` or `+`)
- Use `1.` for ordered lists (auto-numbering)
- Indent nested lists with 2 spaces

**Code Blocks:**

````markdown
# Always specify language for syntax highlighting

```javascript
const example = 'like this';
```
````

# Use bash for shell commands

```bash
npm install
```

# Use yaml for configuration

```yaml
key: value
```

```

**Links:**
- Use relative paths: `../epics/user-authentication/001.md`
- Never use absolute paths: ~~`/Users/username/project/...`~~
- External links: Full URL with HTTPS

### DateTime Standards

**Always Use ISO 8601 UTC Format:**
```

2026-01-06T09:03:33Z

````

**How to Get Current DateTime:**
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
````

**Rules:**

- NEVER use placeholder values like `[Current date]` or `YYYY-MM-DD`
- ALWAYS get real system time with `date` command
- `created` field: Never changes after creation
- `updated` field: Update on every modification
- See `.claude/rules/datetime.md` for complete specification

### Path Standards

**Always Use Relative Paths:**

✅ **Correct:**

```
internal/auth/server.go
../project-name/src/components/Button.tsx
supabase/migrations/001_create_users.sql
```

❌ **Incorrect:**

```
/Users/username/project/internal/auth/server.go
C:\Users\username\project\src\components\Button.tsx
```

**Rationale:**

- Privacy protection (no usernames exposed)
- Cross-platform compatibility
- Document portability
- See `.claude/rules/path-standards.md` for complete specification

## PRD (Product Requirements Document) Standards

### Structure

**Required Sections:**

1. **Executive Summary**: Value proposition, key differentiator
2. **Problem Statement**: What problem, why important now
3. **User Stories**: Personas and detailed journeys
4. **Functional Requirements**: Features and capabilities
5. **Non-Functional Requirements**: Performance, security, reliability
6. **Database Schema**: Tables, fields, relationships
7. **User Interface Requirements**: Screens and flows
8. **Business Rules**: Logic and validation rules
9. **Out of Scope**: What we're NOT building
10. **Success Metrics**: How we measure success

### Writing Style

- **Be Specific**: "Login must complete in <2 seconds" not "Login should be fast"
- **User-Focused**: Describe value to users, not implementation
- **Acceptance-Ready**: Clear enough to validate completion
- **Mobile-First**: Always specify mobile requirements first

### Database Schema Format

```markdown
### Table: users

| Column     | Type         | Nullable | Description   | Notes          |
| ---------- | ------------ | -------- | ------------- | -------------- |
| id         | UUID         | No       | Primary key   | Auto-generated |
| email      | VARCHAR(255) | No       | User email    | Unique         |
| created_at | TIMESTAMP    | No       | Creation time | UTC            |
```

## Epic Standards

### Structure

**Required Sections:**

1. **Overview**: High-level description
2. **Key Technology Decisions**: Architecture choices with rationale
3. **Technical Approach**: Implementation strategy
4. **API Design**: Endpoints and contracts
5. **Database Schema**: Detailed table designs
6. **Security Considerations**: Threats and mitigations
7. **Testing Strategy**: Unit, integration, E2E tests
8. **Performance Targets**: Response times, scalability
9. **External Dependencies**: Services and prerequisites
10. **Implementation Tasks**: Summary of task breakdown

### Code Examples

**Include Actual Code:**

```typescript
// Good - shows actual implementation
export const authConfig = {
  database: {
    adapter: postgresAdapter({
      connectionString: process.env.SUPABASE_DATABASE_URL,
    }),
  },
  // ...
};
```

**Not Pseudo-code:**

```
// Bad - too vague
Configure database adapter with connection string
```

## Task Standards

### File Naming

- Use zero-padded numbers: `001.md`, `002.md`, ... `010.md`
- Allows up to 999 tasks per epic
- Sorted correctly in file systems

### Structure

**Required Sections:**

1. **Description**: What this task accomplishes
2. **Acceptance Criteria**: Checkboxes for completion
3. **Technical Details**: Implementation specifics
4. **Dependencies**: What must be done first
5. **Effort Estimate**: Size (S/M/L/XL) and hours
6. **Definition of Done**: How we know it's complete

### Acceptance Criteria Format

```markdown
## Acceptance Criteria

- [ ] Users table created with 15 fields
- [ ] OAuth providers table created
- [ ] Migrations run successfully
- [ ] Database accessible via Supabase Studio
```

**Rules:**

- Use GitHub-style checkboxes `- [ ]`
- One clear, testable criterion per checkbox
- Be specific and measurable

### Effort Estimates

**Sizes:**

- **S (Small)**: 4-8 hours, single developer, single day
- **M (Medium)**: 8-12 hours, 1-2 days
- **L (Large)**: 14-20 hours, 2-3 days
- **XL (Extra Large)**: 20-24 hours, 3-4 days

**If Larger:** Break into multiple tasks

## Code Standards (Future)

### General Principles

1. **Simple Over Clever**: Readable code > clever code
2. **Explicit Over Implicit**: Clear intent > magic
3. **No Over-Engineering**: Solve today's problem, not tomorrow's
4. **DRY (Don't Repeat Yourself)**: But don't abstract prematurely
5. **YAGNI (You Aren't Gonna Need It)**: Don't build features speculatively

### Naming Conventions (To Be Defined)

**Variables and Functions:**

- Use descriptive names: `getUserById()` not `get()`
- Prefer clarity over brevity: `userEmailAddress` not `uea`

**Constants:**

- Use SCREAMING_SNAKE_CASE: `MAX_LOGIN_ATTEMPTS`
- Define at top of file or in constants file

**Files:**

- Match primary export: `UserProfile.tsx` exports `UserProfile` component
- Use PascalCase for components: `ClientCard.tsx`
- Use kebab-case for utilities: `format-date.ts`

### Comments

**When to Comment:**

- Complex business logic
- Non-obvious security considerations
- Workarounds for bugs
- Performance optimizations

**When NOT to Comment:**

```typescript
// Bad - obvious
const userId = user.id; // Get user ID

// Good - explains why
const userId = user.id; // Required by Better Auth for session token
```

### Error Handling

**Principle**: Fail loudly and clearly

```typescript
// Good - specific error message
if (!user) {
  throw new Error('User not found for email: ' + email);
}

// Bad - vague error
if (!user) {
  throw new Error('Error');
}
```

## SQL Standards

### Table Names

- Use lowercase with underscores: `client_documents`
- Use plural for collections: `users`, `clients`, `tasks`
- Be explicit: `password_resets` not `resets`

### Column Names

- Use lowercase with underscores: `created_at`, `user_id`
- Be descriptive: `email_verified_at` not `verified`
- Boolean fields: `is_deleted`, `has_trial_expired`
- Foreign keys: `user_id` references `users.id`

### Migration Files

**Naming:**

```
YYYYMMDDHHMMSS_descriptive_name.sql
20260106093033_create_users_table.sql
```

**Structure:**

```sql
-- Create users table
-- Migration: 20260106093033

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Comments
COMMENT ON TABLE users IS 'User accounts for authentication';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash, null for OAuth-only users';
```

**Rules:**

- One table per migration file
- Include rollback comments (future)
- Add indexes for frequently queried columns
- Comment non-obvious design decisions

## API Standards (Future)

### Endpoint Naming

**RESTful Conventions:**

```
GET    /api/clients          # List all clients
POST   /api/clients          # Create client
GET    /api/clients/:id      # Get specific client
PUT    /api/clients/:id      # Update client
DELETE /api/clients/:id      # Delete (soft) client
```

**Rules:**

- Use plural nouns: `/clients` not `/client`
- No verbs in URLs: `/api/clients` not `/api/getClients`
- Use HTTP methods for actions
- Nested resources: `/api/clients/:id/documents`

### Response Format

**Success:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "status": 404
}
```

### Status Codes

- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Testing Standards (Future)

### Test File Naming

- Mirror source structure: `src/auth/login.ts` → `tests/auth/login.test.ts`
- Use `.test.ts` or `.spec.ts` suffix
- Component tests: `Button.test.tsx`

### Test Structure

```typescript
describe('Authentication', () => {
  describe('login', () => {
    it('returns JWT token on valid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'Test123!' };

      // Act
      const result = await login(credentials);

      // Assert
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(credentials.email);
    });

    it('throws error on invalid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };

      await expect(login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });
});
```

**Patterns:**

- Use Arrange-Act-Assert pattern
- One assertion concept per test
- Descriptive test names (what, when, expected)
- Test both happy path and error cases

## Git Standards

### Commit Messages

**Format:**

```
Issue #123: Add user authentication endpoints

- Implemented POST /api/auth/register
- Added email verification token generation
- Created password hashing with bcrypt
```

**Rules:**

- Start with Issue number if applicable
- First line: Imperative mood, <50 chars
- Blank line, then bullet points for details
- Reference issue/task numbers

**Examples:**

- ✅ "Issue #123: Add user registration endpoint"
- ✅ "Fix password reset email template"
- ❌ "Updated stuff"
- ❌ "WIP"

### Branch Naming

**Not yet defined** - waiting for development to start

**Likely Pattern:**

- `epic/user-authentication` - Epic branches
- `task/001-database-schema` - Task branches
- `fix/login-error` - Bug fixes
- `docs/update-readme` - Documentation

## Security Standards

### Sensitive Data

**NEVER commit:**

- API keys or secrets
- Database passwords
- OAuth client secrets
- JWT secrets
- `.env` files with real values

**Always use:**

- `.env.example` with placeholder values
- Environment variables for secrets
- `.gitignore` for sensitive files

### Password Handling

**Requirements:**

- Bcrypt with cost factor 12 minimum
- Never log passwords (even masked)
- Never return password_hash in API responses
- Validate complexity: 8+ chars, mixed case, number, symbol

### Token Handling

**JWT Tokens:**

- Store minimal data in payload
- Use short expiration (3 days default)
- Sign with strong secret (256-bit)
- Validate on every request

## Performance Standards

### Response Times

- Login: <2 seconds
- Registration: <3 seconds
- API endpoints: <500ms average
- Page load: <3 seconds
- Database queries: <100ms average

### Mobile Optimization

- Images: WebP format, lazy loading
- JavaScript: Code splitting, tree shaking
- CSS: Critical CSS inline, defer non-critical
- Fonts: Subset fonts, preload key fonts
- Bundle size: <200KB gzipped for main bundle

## Accessibility Standards (Future)

### WCAG 2.1 Level AA Compliance

- Semantic HTML (not div soup)
- Keyboard navigation support
- ARIA labels for screen readers
- Color contrast ratios (4.5:1 minimum)
- Form labels and error messages
- Focus indicators visible

## Project Management Standards

### Status Values

**PRDs:**

- `backlog` - Not started
- `in-progress` - Being worked on
- `complete` - Done

**Epics:**

- `backlog` - Not started
- `in-progress` - Tasks being worked on
- `completed` - All tasks done

**Tasks:**

- `open` - Ready to start
- `in-progress` - Being worked on
- `closed` - Completed

### Task Dependencies

**Format:**

```yaml
depends_on: [001, 002]
```

**Rules:**

- Use task numbers, not names
- List all blocking tasks
- Update epic.md when dependencies change

## Documentation Maintenance

### When to Update

**Always update `updated` field when:**

- Changing any content
- Modifying frontmatter (except `created`)
- Adding/removing sections
- Fixing typos or formatting

**Update related docs when:**

- Architecture changes (update tech-context.md)
- New features added (update product-context.md)
- Decisions made (update progress.md)
- Milestones reached (update project-brief.md)

### Context System

**Update Frequency:**

- `/context:prime` - Start of every session
- `/context:update` - End of significant work sessions
- Major milestones (PRD complete, epic done, feature launched)

## Notes

- Standards will evolve as development begins
- Frontend framework selection will define more specific standards
- Testing standards depend on framework choice
- These are guidelines, not rigid rules - use judgment
- Consistency is more important than perfection
