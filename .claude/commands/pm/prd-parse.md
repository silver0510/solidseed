---
allowed-tools: Bash, Read, Write, LS
---

# PRD Parse

Convert PRD to technical implementation epic.

## Usage

```
/pm:prd-parse <feature_name>
```

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:

- `.claude/rules/datetime.md` - For getting real current date/time
- `.claude/rules/database-operations.md` - For database schema conventions

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress ("I'm not going to ..."). Just do them and move on.

### Validation Steps

1. **Verify <feature_name> was provided as a parameter:**
   - If not, tell user: "❌ <feature_name> was not provided as parameter. Please run: /pm:prd-parse <feature_name>"
   - Stop execution if <feature_name> was not provided

2. **Verify PRD exists:**
   - Check if `.claude/prds/$ARGUMENTS.md` exists
   - If not found, tell user: "❌ PRD not found: $ARGUMENTS. First create it with: /pm:prd-new $ARGUMENTS"
   - Stop execution if PRD doesn't exist

3. **Validate PRD frontmatter:**
   - Verify PRD has valid frontmatter with: name, description, status, created
   - If frontmatter is invalid or missing, tell user: "❌ Invalid PRD frontmatter. Please check: .claude/prds/$ARGUMENTS.md"
   - Show what's missing or invalid

4. **Check for existing epic:**
   - Check if `.claude/epics/$ARGUMENTS/epic.md` already exists
   - If it exists, ask user: "⚠️ Epic '$ARGUMENTS' already exists. Overwrite? (yes/no)"
   - Only proceed with explicit 'yes' confirmation
   - If user says no, suggest: "View existing epic with: /pm:epic-show $ARGUMENTS"

5. **Verify directory permissions:**
   - Ensure `.claude/epics/` directory exists or can be created
   - If cannot create, tell user: "❌ Cannot create epic directory. Please check permissions."

6. **Load current database schema:**
   - Read `.claude/database/database.dbml` if it exists
   - Use this as reference for existing tables and conventions
   - If DBML doesn't exist, warn: "⚠️ No database.dbml found. Run /pm:db-sync generate to create one."

## Instructions

You are a technical lead converting a Product Requirements Document into a detailed implementation epic for: **$ARGUMENTS**

### 1. Read the PRD

- Load the PRD from `.claude/prds/$ARGUMENTS.md`
- Understand the Overview (purpose, target users, business value)
- Analyze Scope (in/out boundaries, success criteria)
- Review Functional Requirements (feature groups with user stories)
- Study Database Schema, Business Rules, and Dependencies
- Extract the PRD description from frontmatter

### 2. Technical Analysis

- Identify architectural decisions needed
- Determine technology stack and approaches
- Map functional requirements to technical components
- Identify integration points and dependencies
- **Reference existing database schema** from `.claude/database/database.dbml`:
  - Identify existing tables that can be reused
  - Plan new tables following established naming conventions
  - Note relationships with existing tables

### 3. File Format with Frontmatter

Create the epic file at: `.claude/epics/$ARGUMENTS/epic.md` with this exact structure:

**CRITICAL**: The epic is the single source of truth for ALL technical implementation details. Tasks will reference sections here, so include complete code, configurations, and step-by-step instructions. Do NOT create a "Task Breakdown Preview" section - that's redundant with actual task files.

```markdown
---
name: $ARGUMENTS
status: backlog
created: [Current ISO date/time]
progress: 0%
prd: .claude/prds/$ARGUMENTS.md
github: [Will be updated when synced to GitHub]
---

# Epic: $ARGUMENTS

## Overview

Brief technical summary (2-3 sentences) of the implementation approach and key technology decisions.

## Architecture Decisions

### 1. [Decision Name]

**Decision**: What was decided

**Rationale**:
- Why this approach
- Key benefits

**Trade-offs**:
- What we're giving up
- Mitigation strategies

[Repeat for each major architectural decision - aim for 3-5 key decisions]

## Implementation Guide

**CRITICAL**: This section contains ALL technical details that tasks will reference. Include complete code, configurations, and detailed instructions.

### Database Schema

**Reference**: See `.claude/database/database.dbml` for existing schema and conventions.

**Existing Tables Used**:
- [List tables from DBML that this feature will use]

**New Tables** (follow conventions from database.dbml):

```sql
-- Complete SQL for all new tables with comments
-- Use VARCHAR(255) for IDs (CUID compatibility with Better Auth)
CREATE TABLE table_name (
  id VARCHAR(255) PRIMARY KEY,
  field_name TYPE CONSTRAINTS,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- All indexes (follow idx_{table}_{column} naming)
CREATE INDEX idx_table_field ON table_name(field);
CREATE INDEX idx_table_composite ON table_name(field1, field2);
```

**DBML Addition** (to be added to database.dbml):

```dbml
Table table_name {
  id varchar(255) [pk, note: 'Unique identifier (CUID)']
  // ... columns
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    field [name: 'idx_table_field']
  }

  note: 'Table description'
}
```

[Include complete schema from PRD with all tables, indexes, constraints]

### API Endpoints

**POST /api/endpoint-name**
- **Purpose**: Brief description
- **Request Body**:
  ```json
  {
    "field": "value"
  }
  ```
- **Validation**: What to validate (email format, required fields, etc.)
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {}
  }
  ```
- **Response Error (400/401/etc.)**:
  ```json
  {
    "error": "Error message"
  }
  ```

[Document ALL endpoints with complete request/response examples]

### Configuration Files

**File: config/service.config.ts**

```typescript
// Complete configuration code
import { adapter } from '@service/adapter';

export const config = {
  database: {
    adapter: adapter({
      connectionString: process.env.DATABASE_URL,
    }),
  },
  // All other configuration with comments
  session: {
    expiresIn: '3d',
    secret: process.env.JWT_SECRET,
  },
};
```

[Include ALL config files that will be created - complete code, not snippets]

### Frontend Components

**Component: ComponentName**

Purpose: What this component does

Key implementation:
- Props: `{ prop1: type, prop2: type }`
- State: What state to manage
- Handlers: Key event handlers needed
- Styling: Mobile-first considerations

[List all major components with enough detail for implementation]

### Service Integration Code

**Service: ServiceName**

```typescript
// Complete service client implementation
export class ServiceClient {
  constructor(private apiKey: string) {}

  async methodName(params: Params): Promise<Result> {
    // Full implementation code
    const response = await fetch(url, {
      // complete options
    });
    return response.json();
  }
}
```

[Include complete service client code for each integration]

## Third-Party Setup

### [Service Name] Setup (e.g., Google OAuth, Resend Email, etc.)

**Prerequisites**:
- Account type needed
- What to have ready

**Step 1: [Action Name]**
1. Go to [specific URL]
2. Click [specific button/menu]
3. Enter [specific values]
4. Select [specific options]

**Step 2: [Configuration]**
1. Navigate to [section]
2. Configure [settings] with values:
   - Setting 1: `value`
   - Setting 2: `value`
3. Save configuration

**Step 3: Get Credentials**
1. Copy Client ID from [location]
2. Generate Client Secret by [action]
3. Add to `.env.local`:
   ```bash
   SERVICE_CLIENT_ID=xxx
   SERVICE_CLIENT_SECRET=xxx
   SERVICE_REDIRECT_URI=http://localhost:3000/callback
   ```

**Step 4: Test Integration**
```bash
# Test command or code snippet
curl http://localhost:3000/api/test-service
```

Expected result: `{ "status": "connected" }`

[Provide complete setup instructions for EACH external service]

## Dependencies

**External Dependencies**:
- [Service/Tool Name]: [Why it's needed and when to set up]

**Internal Dependencies**:
- [Feature/Epic that must complete first]: [Why]

**Data Dependencies**:
- [Data/credentials needed]: [Where to get it]

## Success Criteria (Technical)

**Performance Benchmarks**:
- [Specific metric]: [Target value and measurement method]

**Quality Gates**:
- [ ] Test coverage > X%
- [ ] No critical security vulnerabilities
- [ ] Mobile responsive (375px+ width)

**Acceptance Criteria**:
- [ ] [Specific testable criterion from PRD]
- [ ] [Another criterion]

## Estimated Effort

- **Total Duration**: X-Y weeks
- **Breakdown by Area**:
  - Backend Development: X hours
  - Frontend Development: Y hours
  - Third-Party Integration: Z hours
  - Testing & QA: W hours
- **Critical Path**: [Which tasks must happen sequentially]
```

### 4. Frontmatter Guidelines

- **name**: Use the exact feature name (same as $ARGUMENTS)
- **status**: Always start with "backlog" for new epics
- **created**: Get REAL current datetime by running: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- **progress**: Always start with "0%" for new epics
- **prd**: Reference the source PRD file path
- **github**: Leave placeholder text - will be updated during sync

### 5. Output Location

Create the directory structure if it doesn't exist:

- `.claude/epics/$ARGUMENTS/` (directory)
- `.claude/epics/$ARGUMENTS/epic.md` (epic file)

### 6. Quality Validation

Before saving the epic, verify:

- [ ] Overview is concise (2-3 sentences)
- [ ] Architecture decisions include rationale and trade-offs (3-5 key decisions)
- [ ] Implementation Guide includes COMPLETE code (no snippets or "TODO" placeholders)
- [ ] All PRD database schema is in "Database Schema" section with full SQL
- [ ] All API endpoints documented with complete request/response examples
- [ ] All configuration files include full TypeScript/JavaScript code
- [ ] Third-Party Setup has step-by-step instructions for EACH service
- [ ] PRD functional requirements mapped to implementation sections
- [ ] PRD business rules reflected in implementation guide
- [ ] PRD dependencies mapped to technical dependencies
- [ ] Success criteria are measurable and testable
- [ ] Effort estimates are realistic
- [ ] NO "Task Breakdown Preview" section (redundant with actual tasks)
- [ ] Database schema references existing DBML conventions
- [ ] New tables include DBML addition section for /pm:db-sync

### 7. Post-Creation

After successfully creating the epic:

1. Confirm: "✅ Epic created: .claude/epics/$ARGUMENTS/epic.md"
2. Show summary of:
   - Epic size (number of lines)
   - Key architecture decisions (count)
   - Implementation Guide sections included
   - Third-Party Setup services documented
   - Estimated effort
3. Suggest next step: "Ready to break down into tasks? Run: /pm:epic-decompose $ARGUMENTS"
4. If new database tables are defined: "Remember to update database.dbml after creating migrations: /pm:db-sync update"

**Quality Check**: Epic should be 400-600 lines with comprehensive implementation details.

## Error Recovery

If any step fails:

- Clearly explain what went wrong
- If PRD is incomplete, list specific missing sections:
  - Overview (purpose, target users, business value)
  - Scope (in/out, success criteria)
  - Functional Requirements (feature groups, user stories, acceptance criteria)
  - Database Schema
  - Business Rules
  - Dependencies
- If technical approach is unclear, identify what needs clarification
- Never create an epic with incomplete information

Focus on creating a technically sound implementation plan that addresses all PRD requirements while being practical and achievable for "$ARGUMENTS".

## IMPORTANT:

- Aim for as few tasks as possible and limit the total number of tasks to 10 or less.
- When creating the epic, identify ways to simplify and improve it. Look for ways to leverage existing functionality instead of creating more code when possible.
