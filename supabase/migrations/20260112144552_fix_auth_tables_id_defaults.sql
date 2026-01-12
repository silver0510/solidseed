-- Migration: Fix id column defaults for auth tables
-- The id columns need default values since Prisma expects database-generated ids

-- Fix auth_logs.id to have a default UUID value
ALTER TABLE auth_logs
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Fix email_verifications.id to have a default UUID value
ALTER TABLE email_verifications
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Add comment for documentation
COMMENT ON COLUMN auth_logs.id IS 'Unique identifier (auto-generated UUID as text)';
COMMENT ON COLUMN email_verifications.id IS 'Unique identifier (auto-generated UUID as text)';
