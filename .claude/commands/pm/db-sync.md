---
allowed-tools: Bash, Read, Write, LS
---

# Database Sync

Synchronize and validate the DBML schema file against Supabase migrations.

## Usage

```
/pm:db-sync [options]
```

Options:
- `validate` - Only validate, don't update (default)
- `update` - Update DBML from migrations
- `generate` - Regenerate DBML from scratch

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:

- `.claude/rules/datetime.md` - For getting real current date/time
- `.claude/rules/database-operations.md` - For DBML conventions

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress. Just do them and move on.

### 1. Verify DBML File Exists

```bash
test -f .claude/database/database.dbml && echo "DBML exists" || echo "DBML missing"
```

If missing and mode is `validate`:
- Tell user: "❌ DBML file not found. Run: /pm:db-sync generate"
- Stop execution

### 2. Check Migrations Directory

```bash
ls -la supabase/migrations/*.sql 2>/dev/null | wc -l
```

If no migrations found:
- Tell user: "❌ No migrations found in supabase/migrations/"
- Stop execution

### 3. Get Current DateTime

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Store for updating the DBML header comment.

## Instructions

### Mode: Validate (Default)

Compare DBML against migrations and report discrepancies.

#### 1. Extract Tables from Migrations

```bash
# Find all CREATE TABLE statements
grep -h "CREATE TABLE" supabase/migrations/*.sql | \
  sed 's/.*CREATE TABLE\s*\(IF NOT EXISTS\s*\)\?\([a-z_]*\).*/\2/' | \
  sort | uniq
```

#### 2. Extract Tables from DBML

```bash
# Find all Table declarations
grep "^Table " .claude/database/database.dbml | \
  sed 's/Table \([a-z_]*\).*/\1/' | \
  sort | uniq
```

#### 3. Compare and Report

For each table in migrations:
- Check if it exists in DBML
- If missing: Report "❌ Missing table: {name}"

For each table in DBML:
- Check if it exists in migrations
- If extra: Report "⚠️ Extra table in DBML: {name}"

For matching tables:
- Compare column counts (approximate)
- Note any major discrepancies

#### 4. Validation Summary

```
🔍 Database Schema Validation

📊 Summary:
  - Tables in migrations: {count}
  - Tables in DBML: {count}
  - Matched: {count}
  - Missing from DBML: {count}
  - Extra in DBML: {count}

✅ Matched Tables:
  - users
  - oauth_providers
  - sessions
  ...

❌ Missing from DBML:
  - {table_name} (found in: migration_file.sql)

⚠️ Extra in DBML:
  - {table_name} (not found in any migration)

💡 Recommendation:
  {suggest action based on findings}
```

### Mode: Update

Update DBML to match current migrations.

#### 1. Read Current DBML

- Load `.claude/database/database.dbml`
- Parse existing table definitions
- Preserve comments and formatting where possible

#### 2. Read All Migrations

For each migration file in order:
- Parse CREATE TABLE statements
- Extract columns, types, constraints
- Extract indexes
- Note foreign key relationships

#### 3. Merge Changes

For new tables:
- Add to DBML with full definition
- Include all columns, indexes, and notes
- Add to appropriate TableGroup

For modified tables:
- Update column definitions
- Update indexes
- Preserve custom notes

For removed tables (if migration has DROP):
- Remove from DBML
- Remove from TableGroup

#### 4. Update Header

```dbml
// SolidSeed CRM Database Schema
// Generated from Supabase migrations
// Last synced: {current_datetime}
```

#### 5. Write Updated DBML

- Write to `.claude/database/database.dbml`
- Validate syntax is correct

### Mode: Generate

Regenerate DBML from scratch based on migrations.

#### 1. Clear Existing Content

- Back up current DBML if exists
- Start fresh with header

#### 2. Process All Migrations in Order

For each migration file (sorted by timestamp):
1. Parse SQL statements
2. Extract table definitions
3. Build DBML representation

#### 3. Generate DBML Structure

```dbml
// SolidSeed CRM Database Schema
// Generated from Supabase migrations
// Last synced: {current_datetime}

Project solidseed {
  database_type: 'PostgreSQL'
  note: 'SolidSeed CRM - Real Estate Professional Platform'
}

// Tables from migrations...
```

#### 4. Organize Tables

- Group by feature area (auth, client_hub, etc.)
- Add TableGroup definitions
- Include relationship references

## SQL to DBML Mapping

### Column Types

| SQL Type | DBML Type |
|----------|-----------|
| VARCHAR(n) | varchar(n) |
| TEXT | text |
| INTEGER | integer |
| BOOLEAN | boolean |
| TIMESTAMPTZ | timestamptz |
| JSONB | jsonb |
| UUID | uuid |

### Constraints

| SQL | DBML |
|-----|------|
| PRIMARY KEY | [pk] |
| NOT NULL | [not null] |
| UNIQUE | [unique] |
| DEFAULT value | [default: value] |
| REFERENCES table(col) | [ref: > table.col] |

### Indexes

| SQL | DBML |
|-----|------|
| CREATE INDEX idx ON tbl(col) | col [name: 'idx'] in indexes {} |
| CREATE UNIQUE INDEX | [unique] attribute |

## Error Handling

### Common Issues

- **Parse error in migration**: "⚠️ Could not parse: {file} - {line}"
- **DBML syntax error**: "❌ Invalid DBML syntax at line {n}"
- **Permission denied**: "❌ Cannot write to .claude/database/"

### Recovery

If update fails:
- Preserve backup of original DBML
- Report which tables were processed
- Suggest manual review

## Post-Sync Summary

```
🔄 Database Sync Complete

📊 Results:
  - Mode: {validate|update|generate}
  - Migrations processed: {count}
  - Tables synchronized: {count}
  - Status: {success|warnings|errors}

📝 Changes Made:
  + Added: {new_table}
  ~ Updated: {modified_table}
  - Removed: {deleted_table}

⏰ Last sync: {timestamp}
💡 Next: Review changes in .claude/database/database.dbml
```

## Integration with Other Commands

After successful sync, remind user:
- "Context commands will now use updated schema"
- "PRD parsing will reference current database structure"
- "Run /context:update to refresh project documentation"

## Important Notes

- **Migrations are authoritative** - DBML reflects migrations, not the other way
- **Preserve custom notes** - Don't overwrite manually added documentation
- **Validate after changes** - Always run validate mode after manual DBML edits
- **Use generate sparingly** - Only when DBML is severely out of sync

$ARGUMENTS
