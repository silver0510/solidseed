/**
 * Fix Avatars Storage Bucket - Make Public
 *
 * Updates the avatars bucket to be publicly readable while maintaining upload restrictions
 */

-- Update bucket to be public (allows getPublicUrl to work)
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- Drop the old private read policy (no longer needed for public bucket)
DROP POLICY IF EXISTS "Users can read their own avatar" ON storage.objects;

-- The existing policies for INSERT, UPDATE, DELETE remain the same
-- They still restrict who can upload/modify files based on user folder structure

-- Note: With a public bucket, anyone can read files using the public URL
-- but only authenticated users can upload/modify their own avatars
