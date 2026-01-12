# Database Operations Rule

Standard patterns for working with database schema documentation using DBML.

## Overview

The project maintains a single source of truth for database structure at `.claude/database/database.dbml`. This file documents all tables, relationships, indexes, and constraints.

## DBML File Location

```
.claude/database/database.dbml
```

This file should always reflect the current state of the Supabase database as defined in `supabase/migrations/`.

## When to Reference DBML

### Commands That Must Read DBML

- `/context:prime` - Load database structure as part of project context
- `/context:create` - Include database overview in tech-stack.md
- `/context:update` - Check for schema changes and update documentation
- `/pm:prd-parse` - Reference existing schema when designing new features
- `/pm:epic-decompose` - Understand current schema for database tasks

### Commands That May Update DBML

- `/pm:db-sync` - Validate and sync DBML with migrations

## Reading Database Schema

When designing features or analyzing the codebase:

```bash
# Read the DBML file for schema reference
cat .claude/database/database.dbml
```

Use the DBML to:
- Understand existing table structures
- Identify available relationships
- Check existing indexes
- Find naming conventions

## Updating Database Schema

### When Adding New Tables

1. First, create the migration in `supabase/migrations/`
2. Then update `.claude/database/database.dbml` to reflect the new table
3. Run `/pm:db-sync` to validate consistency

### DBML Table Template

```dbml
// Brief description of the table
Table table_name {
  id varchar(255) [pk, note: 'Unique identifier (CUID)']

  // Field groups with comments
  field_name type [constraints, note: 'Description']

  // Foreign keys
  related_id varchar(255) [not null, ref: > other_table.id, note: 'Reference description']

  // Timestamps
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`, note: 'Record creation timestamp']
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`, note: 'Record last update timestamp']

  indexes {
    field_name [name: 'idx_table_field']
    (field1, field2) [name: 'idx_table_composite']
  }

  note: 'Table description'
}
```

### DBML Syntax Reference

**Column Types:**
- `varchar(n)` - Variable length string
- `text` - Unlimited text
- `integer` - Integer number
- `boolean` - True/false
- `timestamptz` - Timestamp with timezone
- `jsonb` - JSON binary

**Constraints:**
- `[pk]` - Primary key
- `[not null]` - Required field
- `[unique]` - Unique constraint
- `[default: value]` - Default value
- `[ref: > table.column]` - Foreign key reference
- `[note: 'description']` - Column documentation

**Relationship Types:**
- `>` - Many-to-one
- `<` - One-to-many
- `-` - One-to-one
- `<>` - Many-to-many

## Validation

### Sync Check

Run `/pm:db-sync` to:
1. Compare DBML against actual migrations
2. Report any discrepancies
3. Suggest updates if needed

### Manual Validation

```bash
# List all migrations
ls -la supabase/migrations/

# Check migration for specific table
grep -l "CREATE TABLE table_name" supabase/migrations/*.sql
```

## Table Groups

Organize related tables in groups:

```dbml
TableGroup authentication {
  users
  oauth_providers
  sessions
}

TableGroup client_hub {
  clients
  client_tags
  client_documents
  client_notes
  client_tasks
}
```

## Conventions

### Naming

- **Tables**: Plural, snake_case (`users`, `oauth_providers`)
- **Columns**: Singular, snake_case (`user_id`, `created_at`)
- **Indexes**: `idx_{table}_{column}` pattern
- **Foreign keys**: `fk_{table}_{reference}` pattern

### Standard Fields

All tables should include:
- `id` - Primary key (VARCHAR for CUID compatibility)
- `created_at` - Record creation timestamp
- `updated_at` - Record modification timestamp (where applicable)

### Soft Delete

Tables with GDPR requirements use:
- `is_deleted` - Boolean soft delete flag

## Integration with Commands

### PRD Parse Integration

When `/pm:prd-parse` creates an epic:
1. Read existing schema from DBML
2. Design new tables that follow existing conventions
3. Include DBML updates in epic's Implementation Guide

### Epic Decompose Integration

When `/pm:epic-decompose` creates tasks:
1. Reference DBML for database-related tasks
2. Include "Update database.dbml" step in migration tasks

### Context Integration

When context commands run:
1. `/context:create` - Extract table overview for tech-stack.md
2. `/context:update` - Check if schema changed
3. `/context:prime` - Load schema as part of project understanding

## Important Notes

- **Single Source of Truth**: DBML documents the intended schema
- **Migrations Are Authoritative**: Actual SQL migrations are the real implementation
- **Keep in Sync**: Always update DBML when creating migrations
- **Use Comments**: Document table purposes and column meanings
- **Group Related Tables**: Use TableGroup for organization
