---
task: 001
epic: client-hub
created: 2026-01-12T07:32:21Z
---

# Task 001 Analysis: Database Schema & Migrations

## Task Summary

Create Supabase migrations for all 5 Client Hub tables with RLS policies, indexes, and triggers.

## Work Streams

This task creates database schema only. No parallel work streams - sequential execution of migration files.

### Stream A: Database Schema Creation

**Agent Type**: backend-development

**Files to Create**:
- `supabase/migrations/20260112000000_create_clients_table.sql`
- `supabase/migrations/20260112000001_create_client_tags_table.sql`
- `supabase/migrations/20260112000002_create_client_documents_table.sql`
- `supabase/migrations/20260112000003_create_client_notes_table.sql`
- `supabase/migrations/20260112000004_create_client_tasks_table.sql`
- `supabase/migrations/20260112000005_create_client_hub_rls_policies.sql`
- Update `.claude/database/database.dbml` with new tables

**Work to Complete**:
1. Create clients table with search vector trigger
2. Create client_tags table with unique constraint
3. Create client_documents table with file constraints
4. Create client_notes table with updated_at trigger
5. Create client_tasks table with status/priority constraints
6. Create all RLS policies for data isolation
7. Update database.dbml with Client Hub tables

**Dependencies**: None (User Authentication Epic assumed complete)

## Acceptance Criteria

- [ ] All 5 tables created with correct columns and constraints
- [ ] All indexes created (including GIN index for search_vector)
- [ ] Triggers created (search_vector update, updated_at timestamp)
- [ ] RLS policies enabled on all tables
- [ ] RLS policies enforce agent-level data isolation
- [ ] database.dbml updated with Client Hub tables
- [ ] Migrations run successfully with `supabase db push`
- [ ] Tables visible in Supabase dashboard

## Technical Notes

- Use `VARCHAR(255)` for primary keys (CUID format)
- Phone format: `+1-XXX-XXX-XXXX`
- File size limit: 10MB (10485760 bytes)
- Allowed file types: PDF, DOC, DOCX, JPG, PNG
- Soft delete: `is_deleted` flag on clients table
- All tables cascade delete when client is deleted (except soft delete)
