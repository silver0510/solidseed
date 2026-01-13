# Supabase Integration Rule

Standard patterns for working with Supabase across all commands and tasks.

## Central Documentation

All Supabase setup instructions are maintained in a single source of truth:

**Location**: `SUPABASE-SETUP.md` (project root)

This file contains:
- Initial project setup
- Database configuration
- Storage configuration
- Authentication configuration
- Environment variables
- Production setup checklist
- Troubleshooting guide

## When to Reference SUPABASE-SETUP.md

### Commands That Must Reference

- `/pm:prd-parse` - Include Supabase setup link when creating database-related epics
- `/pm:epic-decompose` - Add Supabase setup task for any storage/database configuration
- `/context:create` - Reference Supabase setup in tech-stack.md
- `/context:prime` - Load Supabase configuration context

### Task Creation Pattern

When epic-decompose creates tasks involving Supabase, include:

```markdown
## Reference

- See [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md) for complete setup guide
- Section: [Specific Section Name]
```

## Supabase-Related Task Types

### Database Tasks

**When creating database migration tasks:**
- Reference `SUPABASE-SETUP.md` → Database Configuration
- Include migration push command: `supabase db push`
- Verify tables created in Supabase Dashboard

**Example task description:**
```markdown
1. Create migration file: `supabase/migrations/YYYYMMDD_feature_name.sql`
2. Push to Supabase: `supabase db push`
3. Verify in Dashboard (see [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md))
```

### Storage Tasks

**When creating storage configuration tasks:**
- Reference `SUPABASE-SETUP.md` → Storage Configuration
- Include bucket creation steps
- Include RLS policy creation
- Add verification steps

**Example task description:**
```markdown
1. Create storage bucket (see [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md#storage-configuration))
2. Configure RLS policies
3. Test upload/download functionality
```

### Authentication Tasks

**When creating auth-related tasks:**
- Reference `SUPABASE-SETUP.md` → Authentication Configuration
- Note Better Auth integration (not Supabase Auth)
- Include type casting requirements (`auth.uid()::text`)

## Type Compatibility Rules

### Better Auth + Supabase Integration

**Critical**: Our project uses Better Auth (not Supabase Auth), which affects RLS policies:

1. **User IDs are VARCHAR, not UUID**
   - Better Auth uses CUID format (VARCHAR 255)
   - Supabase auth functions return UUID
   - Always cast: `auth.uid()::text`

2. **RLS Policy Pattern**
```sql
-- Correct: Cast auth.uid() to text
WHERE user_id = auth.uid()::text

-- Incorrect: Will cause type mismatch error
WHERE user_id = auth.uid()
```

3. **When Adding New RLS Policies**
   - Always include `::text` cast
   - Test with authenticated user
   - Document in SUPABASE-SETUP.md if it's a new pattern

## Epic Decompose Integration

When `/pm:epic-decompose` encounters Supabase-related work:

### Detection Keywords

Tasks requiring Supabase setup reference if they contain:
- "database", "migration", "table", "schema"
- "storage", "bucket", "upload", "file"
- "RLS", "policy", "permission"
- "Supabase" (explicitly mentioned)

### Auto-Include Reference

Add to task markdown:

```markdown
## Setup Reference

Complete Supabase setup guide: [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md)

Relevant sections:
- [Section Name] - Brief description
```

### Update Checklist

For tasks that modify Supabase configuration:

```markdown
## Post-Task Updates

- [ ] Update [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md) if configuration changed
- [ ] Document any new RLS policy patterns
- [ ] Add troubleshooting notes if issues encountered
```

## Maintenance Pattern

### When to Update SUPABASE-SETUP.md

Update the central guide when:
1. Adding new storage buckets
2. Creating new RLS policy patterns
3. Changing authentication configuration
4. Discovering new troubleshooting solutions
5. Adding production-specific configurations

### Update Process

1. Complete Supabase-related task
2. If new patterns emerged, update `SUPABASE-SETUP.md`
3. Keep patterns generic and reusable
4. Include troubleshooting steps
5. Test instructions with fresh project

## Common Patterns

### Storage Bucket Creation

```markdown
1. Navigate to Supabase Dashboard → Storage
2. Create bucket with settings from [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md#storage-configuration)
3. Apply RLS policies (SQL provided in guide)
4. Test with authenticated user
```

### Migration Application

```markdown
1. Create migration: `supabase/migrations/YYYYMMDD_name.sql`
2. Test locally: `supabase db reset`
3. Push to remote: `supabase db push`
4. Verify in Dashboard (see [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md#database-configuration))
```

### RLS Policy Creation

```markdown
1. Write policy SQL with `auth.uid()::text` cast
2. Test policy with authenticated session
3. Document pattern in [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md)
4. Add to migration file for repeatability
```

## Environment Variables

### Reference Pattern

When tasks require environment variables:

```markdown
Required environment variables (see [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md#environment-variables)):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DATABASE_URL`
```

## Production Considerations

### Production Checklist Reference

For production deployment tasks:

```markdown
See [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md#production-setup) for:

- Production project creation
- Migration strategy
- Security hardening
- Performance optimization
```

## Error Handling

### Type Mismatch Errors

```markdown
Error: "operator does not exist: character varying = uuid"

Solution: Add `::text` cast to `auth.uid()`
See: [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md#troubleshooting)
```

### RLS Policy Errors

```markdown
Error: "new row violates row-level security policy"

Troubleshooting:
1. Verify user is authenticated
2. Check `auth.uid()::text` cast present
3. Test policy SQL directly
4. See [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md#troubleshooting)
```

## Best Practices

1. **Single Source of Truth**: Always reference `SUPABASE-SETUP.md`, never duplicate instructions
2. **Keep Updated**: Update central guide when patterns change
3. **Link Specifically**: Reference exact sections when possible
4. **Production Ready**: Include production notes in central guide
5. **Troubleshooting**: Document solutions in central guide for reuse

## Integration with Other Rules

- Works with `/rules/database-operations.md` for schema documentation
- Complements `/rules/standard-patterns.md` for consistent task structure
- Follows `/rules/path-standards.md` for relative path references
