---
task: 001
name: Database Schema and Migrations
analyzed: 2026-01-24T14:15:48Z
streams: 1
---

# Task 001 Analysis: Database Schema and Migrations

## Scope

Create the complete database schema for deal management, including 5 tables with all indexes, constraints, RLS policies, and seed data.

## Work Streams

### Stream A: Database Layer (Single Stream)

**Agent Type:** general-purpose

**Files to Create/Modify:**
- `supabase/migrations/YYYYMMDD_deal_management.sql` - Main migration file
- `.claude/database/database.dbml` - Update with new tables

**Work Description:**
1. Create migration file with 5 tables:
   - deal_types (configuration templates)
   - deals (core transaction records)
   - deal_milestones (key date tracking)
   - deal_documents (document metadata)
   - deal_activities (audit log)

2. Add all indexes including GIN index on deal_data JSONB

3. Configure RLS policies for user-scoped access

4. Insert seed data for:
   - Residential Sale deal type with pipeline stages and enabled fields
   - Mortgage Loan deal type with pipeline stages and enabled fields

5. Update database.dbml documentation

6. Push migration to Supabase

## Technical Notes

- Use UUID primary keys with gen_random_uuid()
- All tables need created_at/updated_at timestamps with CURRENT_TIMESTAMP defaults
- deals table needs soft delete (is_deleted flag)
- RLS policies must cast auth.uid() to text if comparing with VARCHAR user IDs
- Follow existing naming conventions from database.dbml

## Validation Criteria

- [ ] Migration applies cleanly to Supabase
- [ ] All indexes created
- [ ] RLS policies prevent cross-user access
- [ ] Seed data creates 2 deal types
- [ ] database.dbml updated and valid

## Estimated Time

4 hours
