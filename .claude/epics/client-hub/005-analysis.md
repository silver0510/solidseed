---
task: 005
title: Document Management API
analyzed: 2026-01-15T07:35:55Z
execution_mode: sequential
estimated_hours: 4
total_steps: 5
---

# Sequential Implementation Plan: task 005

## Overview

Implement document upload, download (signed URLs), and deletion with Supabase Storage integration. This task creates the DocumentService class and three API endpoints for managing client documents. The implementation follows the existing patterns established in NoteService and other services.

## Implementation Steps

### Step 1: Define Document Types and Validation Schema

**Objective**: Create TypeScript interfaces for documents and Zod validation schemas

**Actions**:
1. Add document types to `lib/types/client.ts` (ClientDocument, CreateDocumentInput)
2. Create document validation schema in `lib/validation/document.ts`
3. Define allowed MIME types and file size constants

**Files**:
- `lib/types/client.ts` (modify - add document types)
- `lib/validation/document.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 0.5
**Prerequisites**: none

**Completion Criteria**:
- [ ] ClientDocument interface defined with all fields from database schema
- [ ] CreateDocumentInput interface defined with file and description fields
- [ ] Zod validation schema validates file type (PDF, DOC, DOCX, JPG, PNG)
- [ ] Zod validation schema validates file size (max 10MB = 10485760 bytes)
- [ ] Constants exported for ALLOWED_FILE_TYPES and MAX_FILE_SIZE

### Step 2: Create DocumentService Class

**Objective**: Implement the core document management service with Supabase Storage integration

**Actions**:
1. Create DocumentService class following NoteService pattern
2. Implement uploadDocument method (storage upload + DB insert + rollback)
3. Implement getDownloadUrl method (signed URL generation)
4. Implement deleteDocument method (storage delete + DB delete)
5. Implement getDocumentsByClient method (list documents)
6. Add proper error handling and rollback logic

**Files**:
- `services/DocumentService.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 1.5
**Prerequisites**: Step 1 must be complete

**Completion Criteria**:
- [ ] DocumentService class created following existing service patterns
- [ ] uploadDocument uploads to storage path: `{clientId}/{documentId}/{filename}`
- [ ] uploadDocument creates database record in client_documents table
- [ ] uploadDocument rolls back storage upload if DB insert fails
- [ ] getDownloadUrl generates signed URL with 1-hour expiry
- [ ] deleteDocument removes from both storage and database
- [ ] getDocumentsByClient returns documents ordered by uploaded_at desc
- [ ] Authentication check using supabase.auth.getUser()

### Step 3: Implement POST /api/clients/:id/documents Endpoint

**Objective**: Create the document upload endpoint with multipart form handling

**Actions**:
1. Create route file with POST handler
2. Handle multipart/form-data file upload
3. Extract file and description from request
4. Validate file type and size
5. Call DocumentService.uploadDocument
6. Return created document with 201 status

**Files**:
- `app/api/clients/[id]/documents/route.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 0.75
**Prerequisites**: Step 2 must be complete

**Completion Criteria**:
- [ ] POST endpoint accepts multipart/form-data
- [ ] File extracted from FormData
- [ ] Description field extracted (optional)
- [ ] File type validated before upload
- [ ] File size validated before upload
- [ ] Returns 201 with document object on success
- [ ] Returns 400 with validation errors
- [ ] Returns 401 if not authenticated
- [ ] Returns 500 on server error

### Step 4: Implement GET and DELETE Document Endpoints

**Objective**: Create download (signed URL) and delete endpoints

**Actions**:
1. Create route file for document-specific operations
2. Implement GET handler for download URL generation
3. Implement DELETE handler for document removal
4. Add proper error handling for not found cases

**Files**:
- `app/api/clients/[id]/documents/[docId]/route.ts` (create)
- `app/api/clients/[id]/documents/[docId]/download/route.ts` (create)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 0.75
**Prerequisites**: Step 2 must be complete

**Completion Criteria**:
- [ ] GET /download returns signed URL with expires_in field
- [ ] DELETE removes document from storage and database
- [ ] DELETE returns 204 on success
- [ ] Returns 404 if document not found
- [ ] Returns 401 if not authenticated
- [ ] Returns 500 on server error

### Step 5: Write Integration Tests

**Objective**: Create comprehensive tests for DocumentService and API endpoints

**Actions**:
1. Create test file for DocumentService unit tests
2. Mock Supabase storage and database operations
3. Test upload success and rollback scenarios
4. Test download URL generation
5. Test delete operations
6. Test validation edge cases

**Files**:
- `services/__tests__/DocumentService.test.ts` (create)
- `app/api/clients/[id]/documents/__tests__/route.test.ts` (create - optional)

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 0.5
**Prerequisites**: Steps 1-4 must be complete

**Completion Criteria**:
- [ ] Tests for uploadDocument success case
- [ ] Tests for uploadDocument rollback on DB error
- [ ] Tests for getDownloadUrl
- [ ] Tests for deleteDocument
- [ ] Tests for file type validation
- [ ] Tests for file size validation
- [ ] All tests passing

## Execution Strategy

**Approach**: Linear, step-by-step implementation with TDD focus

Each step must complete fully before the next step begins. This ensures:
- Clear dependencies are respected
- No file conflicts between steps
- Easier debugging and progress tracking
- Simpler coordination

**TDD Note**: Since this is TDD mode, within each step:
1. Write failing tests first (RED phase)
2. Implement code to pass tests (GREEN phase)
3. Refactor while keeping tests green (REFACTOR phase)

## Expected Timeline

Total implementation time: 4 hours

Step breakdown:
- Step 1: 0.5h (Types & Validation)
- Step 2: 1.5h (DocumentService)
- Step 3: 0.75h (Upload Endpoint)
- Step 4: 0.75h (Download & Delete Endpoints)
- Step 5: 0.5h (Integration Tests)

## Technical Notes

**File Path Structure**: `{clientId}/{documentId}/{filename}`
- Matches Supabase Storage RLS policies from task 002
- Uses `storage.foldername(name)[1]` to extract clientId

**Allowed MIME Types**:
- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `image/jpeg`
- `image/png`

**Max File Size**: 10MB (10485760 bytes)

**Existing Patterns to Follow**:
- Service class pattern from `services/NoteService.ts`
- API route pattern from `app/api/clients/[id]/notes/route.ts`
- Type definitions pattern from `lib/types/client.ts`
- Validation pattern from `lib/validation/note.ts`

**Storage Helper**: Existing `lib/storage.ts` has StorageService but uses different path structure. Create DocumentService with correct path structure as per epic.md specification.
