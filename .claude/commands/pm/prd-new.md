---
allowed-tools: Bash, Read, Write, LS
---

# PRD New

Launch brainstorming for new product requirement document.

## Usage

```
/pm:prd-new <feature_name>
```

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:

- `.claude/rules/datetime.md` - For getting real current date/time

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress ("I'm not going to ..."). Just do them and move on.

### Input Validation

1. **Validate feature name format:**
   - Must contain only lowercase letters, numbers, and hyphens
   - Must start with a letter
   - No spaces or special characters allowed
   - If invalid, tell user: "❌ Feature name must be kebab-case (lowercase letters, numbers, hyphens only). Examples: user-auth, payment-v2, notification-system"

2. **Check for existing PRD:**
   - Check if `.claude/prds/$ARGUMENTS.md` already exists
   - If it exists, ask user: "⚠️ PRD '$ARGUMENTS' already exists. Do you want to overwrite it? (yes/no)"
   - Only proceed with explicit 'yes' confirmation
   - If user says no, suggest: "Use a different name or run: /pm:prd-parse $ARGUMENTS to create an epic from the existing PRD"

3. **Verify directory structure:**
   - Check if `.claude/prds/` directory exists
   - If not, create it first
   - If unable to create, tell user: "❌ Cannot create PRD directory. Please manually create: .claude/prds/"

## Instructions

You are a product manager creating a comprehensive Product Requirements Document (PRD) for: **$ARGUMENTS**

Follow this structured approach:

### 1. Discovery & Context

- Ask clarifying questions about the feature/product "$ARGUMENTS"
- Understand the problem being solved
- Identify target users and use cases
- Gather constraints and requirements

### 2. PRD Structure

Create a comprehensive PRD with these sections:

#### Overview

- **Purpose**: 2-3 sentences explaining what this feature is and why it matters
- **Target Users**: Primary and secondary user types with their key needs
- **Business Value**: Expected metrics and impact

#### Scope

- **In Scope**: Features and capabilities that will be built
- **Out of Scope**: What we're explicitly NOT building
- **Success Criteria**: Measurable outcomes as checkboxes

#### Functional Requirements

Organize by feature groups (user-facing capabilities):

**Feature Group 1: [Capability Name]**
- Brief description of this capability
- **Requirement 1.1**: Specific requirement
  - User Story: As a [role], I want to [action] so that [benefit]
  - Acceptance Criteria: Testable criteria as checkboxes
  - Business Rules: Rules specific to this requirement

Continue for all feature groups and requirements.

#### Database Schema

Tables with fields, types, null constraints, descriptions, and validation rules

#### Business Rules

Global rules and constraints that apply across the feature

#### Dependencies

- **External Systems**: What external systems are needed
- **Existing Features**: What internal features are required
- **Data Requirements**: What data sources are needed

### 3. File Format with Frontmatter

Save the completed PRD to: `.claude/prds/$ARGUMENTS.md` with this exact structure:

```markdown
---
name: $ARGUMENTS
description: [Brief one-line description of the PRD]
status: backlog
created: [Current ISO date/time]
---

# Feature Name

## Overview

**Purpose**: [2-3 sentences]

**Target Users**:
- Primary: [User type] - [Key need]
- Secondary: [User type] - [Key need]

**Business Value**:
- [Metric 1]: [Expected impact]
- [Metric 2]: [Expected impact]

## Scope

### In Scope
- [Feature 1]
- [Feature 2]

### Out of Scope
- [Not included 1]
- [Not included 2]

### Success Criteria
- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]

## Functional Requirements

### Feature Group 1: [Capability Name]

**Description**: [Brief description]

#### Requirement 1.1: [Specific requirement]
- **User Story**: As a [role], I want to [action] so that [benefit]
- **Acceptance Criteria**:
  - [ ] [Testable criterion]
  - [ ] [Testable criterion]
- **Business Rules**:
  - [Rule specific to this requirement]

## Database Schema

### table_name

| Field | Type | Null | Description | Validation |
|-------|------|------|-------------|------------|
| id | UUID | No | Primary key | Auto-generated |

## Business Rules

1. [Rule with clear conditions and outcomes]

## Dependencies

**External Systems**:
- [System name]: [What it provides]

**Existing Features**:
- [Feature name]: [Why it's needed]

**Data Requirements**:
- [Data source]: [What data is needed]
```

### 4. Frontmatter Guidelines

- **name**: Use the exact feature name (same as $ARGUMENTS)
- **description**: Write a concise one-line summary of what this PRD covers
- **status**: Always start with "backlog" for new PRDs
- **created**: Get REAL current datetime by running: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
  - Never use placeholder text
  - Must be actual system time in ISO 8601 format

### 5. Quality Checks

Before saving the PRD, verify:

- [ ] Overview clearly explains what, why, who, and business value
- [ ] Scope has explicit in/out boundaries
- [ ] Success criteria are measurable and use checkboxes
- [ ] Each requirement has user story + acceptance criteria
- [ ] Database schema includes all necessary tables
- [ ] Business rules are clear and actionable
- [ ] Dependencies are identified (external systems, features, data)

### 6. Post-Creation

After successfully creating the PRD:

1. Confirm: "✅ PRD created: .claude/prds/$ARGUMENTS.md"
2. Show brief summary of what was captured
3. Suggest next step: "Ready to create implementation epic? Run: /pm:prd-parse $ARGUMENTS"

## Error Recovery

If any step fails:

- Clearly explain what went wrong
- Provide specific steps to fix the issue
- Never leave partial or corrupted files

Conduct a thorough brainstorming session before writing the PRD. Ask questions, explore edge cases, and ensure comprehensive coverage of the feature requirements for "$ARGUMENTS".
