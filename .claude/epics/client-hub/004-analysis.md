---
task: 004
title: Tags, Notes, Tasks API
analyzed: 2026-01-15T07:11:47Z
execution_mode: sequential
estimated_hours: 6
total_steps: 6
---

# Sequential Implementation Plan: task 004

## Overview

Implement API endpoints for client tags, notes, and tasks management including the agent task dashboard. This implementation builds on the database schema from task 001 and follows the patterns established by task 003 (Client CRUD API). The task uses TDD (Test-Driven Development) workflow - writing tests before implementation.

## Implementation Steps

### Step 1: Define Types and Validation Schemas for Tags, Notes, Tasks

**Objective**: Create TypeScript interfaces and Zod validation schemas for tags, notes, and tasks

**Actions**:
1. Add ClientTag interface to `lib/types/client.ts`
2. Add ClientNote interface to `lib/types/client.ts`
3. Add ClientTask interface to `lib/types/client.ts`
4. Add CreateTagInput, CreateNoteInput, UpdateNoteInput interfaces
5. Add CreateTaskInput, UpdateTaskInput interfaces
6. Add TaskFilters interface for dashboard filtering
7. Create `lib/validation/tag.ts` with Zod schema for tag creation
8. Create `lib/validation/note.ts` with Zod schemas for note CRUD
9. Create `lib/validation/task.ts` with Zod schemas for task CRUD
10. Add validation for task priority (low, medium, high) and status (pending, completed)

**Files**:
- `lib/types/client.ts` (modify - add Tag, Note, Task types)
- `lib/validation/tag.ts` (create)
- `lib/validation/note.ts` (create)
- `lib/validation/task.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 0.5
**Prerequisites**: none

**Completion Criteria**:
- [ ] ClientTag, ClientNote, ClientTask interfaces defined
- [ ] All input/update interfaces defined with proper types
- [ ] Zod schemas created for all entities
- [ ] Task priority validates: low, medium, high
- [ ] Task status validates: pending, completed
- [ ] No TypeScript errors

### Step 2: Implement Tags API (TDD)

**Objective**: Write tests first, then implement POST/DELETE endpoints for client tags

**Actions**:
1. **RED PHASE**: Write tests for TagService
   - Test addTag() success case
   - Test addTag() duplicate tag error
   - Test addTag() client not found
   - Test removeTag() success case
   - Test removeTag() tag not found
   - Test getTagAutocomplete() returns unique tags
2. Write API route tests for tag endpoints
3. Run tests - verify they fail (no implementation)
4. **GREEN PHASE**: Create `services/TagService.ts` with Supabase integration
5. Implement addTag() method with duplicate tag handling
6. Implement removeTag() method
7. Implement getTagAutocomplete() for tag suggestions
8. Create `app/api/clients/[id]/tags/route.ts` POST handler
9. Create `app/api/clients/[id]/tags/[tagId]/route.ts` DELETE handler
10. Create `app/api/tags/autocomplete/route.ts` GET handler
11. Run tests - verify they pass
12. **REFACTOR PHASE**: Improve code quality while keeping tests green

**Files**:
- `services/__tests__/TagService.test.ts` (create)
- `app/api/clients/[id]/tags/__tests__/route.test.ts` (create)
- `services/TagService.ts` (create)
- `app/api/clients/[id]/tags/route.ts` (create)
- `app/api/clients/[id]/tags/[tagId]/route.ts` (create)
- `app/api/tags/autocomplete/route.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 1.5
**Prerequisites**: Step 1 must be complete

**Completion Criteria**:
- [ ] Tests written BEFORE implementation (TDD red phase)
- [ ] TagService class created with all methods
- [ ] POST /api/clients/:id/tags returns 201 on success
- [ ] DELETE /api/clients/:id/tags/:tagId returns 204 on success
- [ ] GET /api/tags/autocomplete returns tag suggestions
- [ ] Duplicate tag returns 400 error
- [ ] All tests passing (100% pass rate)

### Step 3: Implement Notes API (TDD)

**Objective**: Write tests first, then implement CRUD endpoints for client notes

**Actions**:
1. **RED PHASE**: Write tests for NoteService
   - Test createNote() success case
   - Test createNote() with is_important flag
   - Test createNote() empty content error
   - Test updateNote() success case
   - Test updateNote() note not found
   - Test deleteNote() success case
   - Test listNotes() with is_important filter
2. Write API route tests for note endpoints
3. Run tests - verify they fail (no implementation)
4. **GREEN PHASE**: Create `services/NoteService.ts` with Supabase integration
5. Implement createNote() method
6. Implement updateNote() method with ownership check
7. Implement deleteNote() method with ownership check
8. Implement listNotes() with is_important filtering
9. Create `app/api/clients/[id]/notes/route.ts` POST handler
10. Create `app/api/clients/[id]/notes/[noteId]/route.ts` PATCH/DELETE handlers
11. Run tests - verify they pass
12. **REFACTOR PHASE**: Improve code quality while keeping tests green

**Files**:
- `services/__tests__/NoteService.test.ts` (create)
- `app/api/clients/[id]/notes/__tests__/route.test.ts` (create)
- `services/NoteService.ts` (create)
- `app/api/clients/[id]/notes/route.ts` (create)
- `app/api/clients/[id]/notes/[noteId]/route.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 1.5
**Prerequisites**: Steps 1 and 2 must be complete

**Completion Criteria**:
- [ ] Tests written BEFORE implementation (TDD red phase)
- [ ] NoteService class created with all methods
- [ ] POST /api/clients/:id/notes returns 201 on success
- [ ] PATCH /api/clients/:id/notes/:noteId returns 200 on success
- [ ] DELETE /api/clients/:id/notes/:noteId returns 204 on success
- [ ] is_important filter works in list queries
- [ ] Empty content returns 400 error
- [ ] All tests passing (100% pass rate)

### Step 4: Implement Tasks API (TDD)

**Objective**: Write tests first, then implement CRUD endpoints for client tasks

**Actions**:
1. **RED PHASE**: Write tests for TaskService
   - Test createTask() success case
   - Test createTask() with priority and due_date
   - Test createTask() empty title error
   - Test updateTask() success case
   - Test updateTask() status change sets completed_at
   - Test updateTask() task not found
   - Test deleteTask() success case
   - Test completed_at auto-set when status=completed
   - Test completed_at cleared when status changed back to pending
2. Write API route tests for task endpoints
3. Run tests - verify they fail (no implementation)
4. **GREEN PHASE**: Create `services/TaskService.ts` with Supabase integration
5. Implement createTask() method with default priority
6. Implement updateTask() with completed_at auto-set logic
7. Implement deleteTask() method with ownership check
8. Create `app/api/clients/[id]/tasks/route.ts` POST handler
9. Create `app/api/clients/[id]/tasks/[taskId]/route.ts` PATCH/DELETE handlers
10. Run tests - verify they pass
11. **REFACTOR PHASE**: Improve code quality while keeping tests green

**Files**:
- `services/__tests__/TaskService.test.ts` (create)
- `app/api/clients/[id]/tasks/__tests__/route.test.ts` (create)
- `services/TaskService.ts` (create)
- `app/api/clients/[id]/tasks/route.ts` (create)
- `app/api/clients/[id]/tasks/[taskId]/route.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 1.5
**Prerequisites**: Steps 1, 2, and 3 must be complete

**Completion Criteria**:
- [ ] Tests written BEFORE implementation (TDD red phase)
- [ ] TaskService class created with all methods
- [ ] POST /api/clients/:id/tasks returns 201 on success
- [ ] PATCH /api/clients/:id/tasks/:taskId returns 200 on success
- [ ] DELETE /api/clients/:id/tasks/:taskId returns 204 on success
- [ ] completed_at auto-set when status=completed
- [ ] completed_at cleared when status changed to pending
- [ ] Empty title returns 400 error
- [ ] All tests passing (100% pass rate)

### Step 5: Implement Agent Task Dashboard (TDD)

**Objective**: Write tests first, then implement GET /api/tasks endpoint for agent task dashboard

**Actions**:
1. **RED PHASE**: Write tests for task dashboard
   - Test listAllTasks() returns tasks across all clients
   - Test filtering by status (pending, completed)
   - Test filtering by priority (low, medium, high)
   - Test filtering by due_before date
   - Test filtering by due_after date
   - Test combined filters work together
   - Test tasks include client info (client_id, client_name)
2. Write API route tests for dashboard endpoint
3. Run tests - verify they fail (no implementation)
4. **GREEN PHASE**: Add listAllTasks() to TaskService
5. Implement filtering by status, priority, due date range
6. Include client info in response for context
7. Create `app/api/tasks/route.ts` GET handler
8. Run tests - verify they pass
9. **REFACTOR PHASE**: Improve code quality while keeping tests green

**Files**:
- `services/__tests__/TaskService.test.ts` (modify - add dashboard tests)
- `app/api/tasks/__tests__/route.test.ts` (create)
- `services/TaskService.ts` (modify - add listAllTasks method)
- `app/api/tasks/route.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 0.5
**Prerequisites**: Steps 1, 2, 3, and 4 must be complete

**Completion Criteria**:
- [ ] Tests written BEFORE implementation (TDD red phase)
- [ ] listAllTasks() method added to TaskService
- [ ] GET /api/tasks returns 200 with task array
- [ ] Status filter works (pending, completed)
- [ ] Priority filter works (low, medium, high)
- [ ] Due date range filters work (due_before, due_after)
- [ ] Response includes client info for each task
- [ ] All tests passing (100% pass rate)

### Step 6: Final Integration Tests and Verification

**Objective**: Run comprehensive end-to-end tests and verify all functionality

**Actions**:
1. Run all unit tests across TagService, NoteService, TaskService
2. Run all API route integration tests
3. Test error handling for all edge cases
4. Test RLS policies (users can only access their own data)
5. Verify API response formats match epic.md specifications
6. Fix any issues found during testing
7. Ensure all checklist items from task 004 are completed
8. Document any API deviations or additional notes
9. Clean up test data if needed
10. Update task status to closed

**Files**:
- `services/__tests__/*.test.ts` (verify all passing)
- `app/api/**/__tests__/*.test.ts` (verify all passing)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 0.5
**Prerequisites**: Steps 1, 2, 3, 4, and 5 must be complete

**Completion Criteria**:
- [ ] All TagService tests passing
- [ ] All NoteService tests passing
- [ ] All TaskService tests passing
- [ ] All API route tests passing
- [ ] RLS policies verified (cross-user access blocked)
- [ ] API response formats match specifications
- [ ] No critical bugs or security issues
- [ ] Task 004 checklist fully completed

## Execution Strategy

**Approach**: Linear, step-by-step TDD implementation

Each step follows the TDD workflow:
1. **RED**: Write failing tests based on requirements
2. **GREEN**: Implement minimal code to make tests pass
3. **REFACTOR**: Improve code quality while keeping tests green

Steps must complete fully before the next step begins. This ensures:
- Tests define expected behavior before coding
- No regressions during implementation
- Clear dependencies respected
- Simpler debugging (one feature at a time)

## Expected Timeline

Total implementation time: 6 hours

Step breakdown:
- Step 1: 0.5h (Types and validation schemas)
- Step 2: 1.5h (Tags API with TDD)
- Step 3: 1.5h (Notes API with TDD)
- Step 4: 1.5h (Tasks API with TDD)
- Step 5: 0.5h (Task dashboard with TDD)
- Step 6: 0.5h (Final verification)

## Notes

### Key Technical Considerations

1. **TDD Workflow**: Write tests FIRST, then implement. This ensures:
   - Clear requirements before coding
   - Higher test coverage
   - Better design (testable code is usually better code)
   - Confidence in refactoring

2. **Following Task 003 Patterns**: Use the same patterns established:
   - Service classes for business logic
   - Zod schemas for validation
   - Consistent error handling with error codes
   - Same API response formats

3. **completed_at Auto-Set Logic**: When task status changes to 'completed':
   - Set completed_at = CURRENT_TIMESTAMP
   - When status changes back to 'pending', clear completed_at = null

4. **Tag Autocomplete**: Query distinct tag_name from client_tags for the authenticated user's clients. This provides suggestions for existing tags.

5. **RLS Policy Enforcement**: All operations go through Supabase client which enforces RLS. Users can only:
   - Access tags/notes/tasks for clients they own (assigned_to = user)
   - Only modify/delete their own notes/tasks (created_by = user)

6. **Error Handling Pattern**:
   - 400: Validation errors, duplicate tag
   - 401: Not authenticated
   - 404: Resource not found
   - 500: Server errors

### Reference Documentation

- API specifications: See epic.md section "API Endpoints"
- Database schema: See `.claude/database/database.dbml`
- Existing patterns: See `services/ClientService.ts`
- Validation patterns: See `lib/validation/client.ts`

### Testing Strategy

For each service (TDD approach):
1. Write comprehensive unit tests first
2. Tests should cover:
   - Happy path (success cases)
   - Error cases (validation, not found, duplicates)
   - Edge cases (empty values, boundary conditions)
3. Then implement minimal code to pass tests
4. Refactor while keeping tests green

Test files structure:
- `services/__tests__/TagService.test.ts`
- `services/__tests__/NoteService.test.ts`
- `services/__tests__/TaskService.test.ts`
- `app/api/*/__tests__/route.test.ts`
