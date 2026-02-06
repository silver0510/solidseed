/**
 * Storage Bucket for User Avatars
 *
 * Creates a public storage bucket for user profile photos.
 * Authorization is handled at the application level via Better Auth.
 */

-- Create the avatars storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket (readable by anyone)
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
