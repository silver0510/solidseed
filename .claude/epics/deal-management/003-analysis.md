---
task: 003
name: Supabase Storage Setup for Documents
analyzed: 2026-01-24T14:25:23Z
streams: 1
---

# Task 003 Analysis: Supabase Storage Setup for Documents

## Scope

Configure Supabase Storage bucket for deal documents with RLS policies and implement document upload/download service.

## Work Streams

### Stream A: Storage Configuration and Service

**Files to Create/Modify:**
- `supabase/migrations/20260124_deal_documents_storage.sql` - Storage RLS policies
- `src/lib/documents.ts` - Document upload/download service
- `src/app/api/deals/[id]/documents/route.ts` - API endpoint

**Work:**

1. **Manual Step in Supabase Dashboard:**
   - Create bucket `deal-documents`
   - Set private (not public)
   - File size limit: 25MB
   - Allowed types: PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX

2. **Storage RLS Policies (migration file):**
   - INSERT: Users can upload to their assigned deals
   - SELECT: Users can view documents from their deals
   - DELETE: Users can delete documents from their deals

3. **Document Service:**
   - uploadDealDocument() - Upload with validation
   - getDealDocuments() - List documents for a deal
   - getDocumentDownloadUrl() - Generate signed URL
   - deleteDealDocument() - Delete with storage cleanup

4. **API Endpoint:**
   - POST /api/deals/:id/documents - Multipart upload
   - GET /api/deals/:id/documents - List documents
   - DELETE /api/deals/:id/documents/:docId - Delete

## Technical Notes

- Storage path format: `deals/{dealId}/documents/{uuid}_{filename}`
- Signed URLs for downloads (1 hour expiry)
- File validation: size <= 25MB, allowed MIME types only
- Log document_upload activity on successful upload
- Log document_delete activity on deletion

## Validation Criteria

- [ ] Storage bucket exists with correct config
- [ ] RLS policies prevent cross-user access
- [ ] Upload validates file size and type
- [ ] Signed URLs work for downloads
- [ ] Activity logging on upload/delete
