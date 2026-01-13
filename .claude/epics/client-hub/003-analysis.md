---
task: 003
title: Client CRUD API
analyzed: 2026-01-13T04:29:25Z
execution_mode: sequential
estimated_hours: 6
total_steps: 5
---

# Sequential Implementation Plan: task 003

## Overview

Implement core client management API endpoints including create, list with pagination/search, get profile, update, and soft delete. This implementation builds on the database schema from task 001 and integrates with Better Auth for user authentication.

## Implementation Steps

### Step 1: Setup ClientService Foundation

**Objective**: Create the base ClientService class with Supabase integration and type definitions

**Actions**:
1. Create `src/services/ClientService.ts` with class structure
2. Initialize Supabase client with environment variables
3. Add TypeScript interfaces for Client, CreateClientInput, UpdateClientInput
4. Add ListClientsParams interface with cursor, limit, search, tag, sort
5. Add PaginatedClients response type
6. Import necessary dependencies (Supabase client, CUID2 for IDs)

**Files**:
- `src/services/ClientService.ts` (create)
- `src/types/client.ts` (create type definitions)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 1.5
**Prerequisites**: none

**Completion Criteria**:
- [ ] ClientService class created with proper structure
- [ ] Supabase client initialized and configured
- [ ] All TypeScript types defined (Client, CreateClientInput, UpdateClientInput, ListClientsParams, PaginatedClients)
- [ ] CUID2 imported for ID generation
- [ ] No TypeScript errors

### Step 2: Implement Create Client Endpoint

**Objective**: Implement POST /api/clients endpoint with validation and error handling

**Actions**:
1. Add `createClient()` method to ClientService
2. Generate CUID for new client ID
3. Get authenticated user from Better Auth session
4. Insert client into Supabase with created_by and assigned_to fields
5. Create Zod validation schema for CreateClientInput
6. Validate email format and phone format (+1-XXX-XXX-XXXX)
7. Add error handling for duplicate email/phone (unique constraint violations)
8. Create POST /api/clients API route handler
9. Return 201 status with created client data

**Files**:
- `src/services/ClientService.ts` (modify - add createClient method)
- `src/lib/validation/client.ts` (create Zod schemas)
- `src/app/api/clients/route.ts` (create POST handler)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 1.5
**Prerequisites**: Step 1 must be complete

**Completion Criteria**:
- [ ] createClient() method implemented in ClientService
- [ ] Zod validation schema created with all field validations
- [ ] Phone format validation enforces +1-XXX-XXX-XXXX pattern
- [ ] Email uniqueness error returns 400 with clear error message
- [ ] POST /api/clients endpoint returns 201 on success
- [ ] Better Auth session integration works (created_by, assigned_to populated)

### Step 3: Implement List Clients Endpoint

**Objective**: Implement GET /api/clients endpoint with cursor pagination, search, and filtering

**Actions**:
1. Add `listClients()` method to ClientService
2. Implement cursor-based pagination using created_at field
3. Add support for limit parameter (default 20, max 100)
4. Implement search functionality using PostgreSQL full-text search
5. Add tag filtering capability
6. Add sort parameter support (created_at, name)
7. Filter out soft-deleted clients (is_deleted = false)
8. Include client_tags relationship in query
9. Return total count and next_cursor for pagination
10. Create GET /api/clients API route handler

**Files**:
- `src/services/ClientService.ts` (modify - add listClients method)
- `src/app/api/clients/route.ts` (modify - add GET handler)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 1.5
**Prerequisites**: Steps 1 and 2 must be complete

**Completion Criteria**:
- [ ] listClients() method implemented with cursor pagination
- [ ] Pagination works correctly (cursor, limit, next_cursor)
- [ ] Search functionality works (searches name, email)
- [ ] Tag filtering works (filters by tag_name)
- [ ] Sort parameter works (created_at, name)
- [ ] Soft-deleted clients excluded from results
- [ ] GET /api/clients endpoint returns 200 with paginated data
- [ ] Response includes total_count and next_cursor

### Step 4: Implement Get, Update, and Delete Endpoints

**Objective**: Implement GET /api/clients/:id, PATCH /api/clients/:id, and DELETE /api/clients/:id endpoints

**Actions**:
1. Add `getClientById()` method to ClientService
2. Include related data counts (documents_count, notes_count, tasks_count)
3. Add `updateClient()` method to ClientService
4. Use Zod schema for update validation (partial validation)
5. Add `softDeleteClient()` method to ClientService
6. Set is_deleted = true instead of actual deletion
7. Create GET /api/clients/[id]/route.ts with GET handler
8. Create PATCH /api/clients/[id]/route.ts with PATCH handler
9. Create DELETE /api/clients/[id]/route.ts with DELETE handler
10. Add 404 error handling for non-existent clients

**Files**:
- `src/services/ClientService.ts` (modify - add getClientById, updateClient, softDeleteClient methods)
- `src/app/api/clients/[id]/route.ts` (create GET, PATCH, DELETE handlers)
- `src/lib/validation/client.ts` (modify - add update schema)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 1
**Prerequisites**: Steps 1, 2, and 3 must be complete

**Completion Criteria**:
- [ ] getClientById() returns client with related counts
- [ ] updateClient() validates and updates client data
- [ ] softDeleteClient() sets is_deleted flag (not hard delete)
- [ ] GET /api/clients/:id returns 200 with full profile
- [ ] PATCH /api/clients/:id returns 200 with updated client
- [ ] DELETE /api/clients/:id returns 204 on success
- [ ] All endpoints return 404 for non-existent clients
- [ ] RLS policies respected (user can only access their own clients)

### Step 5: Add Comprehensive Tests

**Objective**: Write and verify tests for all CRUD operations

**Actions**:
1. Create test file for ClientService
2. Write tests for createClient (success, validation errors, duplicates)
3. Write tests for listClients (pagination, search, filtering)
4. Write tests for getClientById (success, not found)
5. Write tests for updateClient (success, validation)
6. Write tests for softDeleteClient (success, verify not hard deleted)
7. Write API endpoint tests (integration tests)
8. Test error handling for all edge cases
9. Run all tests and verify they pass
10. Fix any issues found during testing

**Files**:
- `src/services/__tests__/ClientService.test.ts` (create)
- `src/app/api/clients/__tests__/route.test.ts` (create)
- `src/app/api/clients/[id]/__tests__/route.test.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 0.5
**Prerequisites**: Steps 1, 2, 3, and 4 must be complete

**Completion Criteria**:
- [ ] All ClientService methods have unit tests
- [ ] All API endpoints have integration tests
- [ ] Tests cover success cases and error cases
- [ ] Tests verify validation rules (email, phone format)
- [ ] Tests verify pagination works correctly
- [ ] Tests verify soft delete (is_deleted flag, not hard delete)
- [ ] All tests passing (100% pass rate)
- [ ] Code coverage meets project standards

## Execution Strategy

**Approach**: Linear, step-by-step implementation

Each step must complete fully before the next step begins. This ensures:
- Clear dependencies are respected (foundation before features)
- No file conflicts between steps (single agent working sequentially)
- Easier debugging and progress tracking (one feature at a time)
- Simpler coordination (no parallel work streams to coordinate)

## Expected Timeline

Total implementation time: 6 hours

Step breakdown:
- Step 1: 1.5h (Setup foundation)
- Step 2: 1.5h (Create endpoint)
- Step 3: 1.5h (List endpoint with pagination)
- Step 4: 1h (Get, update, delete endpoints)
- Step 5: 0.5h (Tests)

## Notes

### Key Technical Considerations

1. **Better Auth Integration**: Use Better Auth session to get authenticated user ID for created_by and assigned_to fields. The RLS policies will automatically filter clients to only show those belonging to the authenticated user.

2. **Cursor-Based Pagination**: Use `created_at` field as the cursor. When `cursor` parameter is provided, query for records where `created_at < cursor`. This provides consistent pagination even when data changes.

3. **Phone Validation**: Enforce strict +1-XXX-XXX-XXXX format using Zod regex pattern. This ensures consistent phone number format across the system.

4. **Email Uniqueness**: Handle Supabase unique constraint violation (error code 23505) and return user-friendly error message: "Email already exists".

5. **Soft Delete**: NEVER hard delete clients. Always set `is_deleted = true` to maintain referential integrity with related documents, notes, and tasks. The RLS policies automatically filter out soft-deleted records.

6. **RLS Type Casting**: Remember to cast `auth.uid()::text` in RLS policies since Better Auth uses VARCHAR for user IDs, not UUID.

### Reference Documentation

- API specifications: See epic.md section "API Endpoints"
- Service implementation patterns: See epic.md section "Service Integration Code > ClientService"
- Pagination approach: See epic.md section "Architecture Decisions > Cursor-Based Pagination"
- Database schema: See `.claude/database/database.dbml`
- Supabase setup: See `SUPABASE-SETUP.md`

### Testing Strategy

- Unit tests for ClientService methods (mock Supabase client)
- Integration tests for API endpoints (test against real Supabase instance)
- Test both success and error paths
- Verify RLS policies work (users can only access their own clients)
- Test edge cases: pagination boundaries, empty results, invalid inputs
