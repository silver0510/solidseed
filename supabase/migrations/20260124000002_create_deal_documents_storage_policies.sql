-- =============================================================================
-- DEAL DOCUMENTS STORAGE RLS POLICIES
-- =============================================================================
-- Creates Row Level Security policies for the deal-documents storage bucket
-- Scopes access to deal ownership - users can only upload/view/delete documents
-- for deals they are assigned to
-- Author: Task 003 - Supabase Storage Setup for Documents
-- Created: 2026-01-24
-- =============================================================================

-- IMPORTANT: This migration requires the 'deal-documents' storage bucket to exist.
-- Create the bucket manually in Supabase Dashboard:
--   1. Navigate to Storage > Buckets
--   2. Click "New bucket"
--   3. Name: deal-documents
--   4. Public: No (keep private)
--   5. File size limit: 26214400 (25MB in bytes)
--   6. Allowed MIME types: application/pdf,image/jpeg,image/png,application/msword,
--      application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--      application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

-- =============================================================================
-- STORAGE RLS POLICIES
-- =============================================================================

-- Policy: Users can upload documents to their assigned deals
-- Path format: deals/{deal_id}/documents/{uuid}_{filename}
CREATE POLICY "Users can upload to their deals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deal-documents' AND
  (storage.foldername(name))[1] = 'deals' AND
  EXISTS (
    SELECT 1 FROM deals
    WHERE id::text = (storage.foldername(name))[2]
    AND assigned_to = auth.uid()
    AND is_deleted = false
  )
);

-- Policy: Users can view documents from their assigned deals
CREATE POLICY "Users can view their deal documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1 FROM deals
    WHERE id::text = (storage.foldername(name))[2]
    AND assigned_to = auth.uid()
  )
);

-- Policy: Users can delete documents from their assigned deals
CREATE POLICY "Users can delete their deal documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1 FROM deals
    WHERE id::text = (storage.foldername(name))[2]
    AND assigned_to = auth.uid()
  )
);

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- To verify the policies were created:
-- SELECT * FROM pg_policies
-- WHERE schemaname = 'storage'
-- AND tablename = 'objects'
-- AND policyname LIKE '%deal%';
