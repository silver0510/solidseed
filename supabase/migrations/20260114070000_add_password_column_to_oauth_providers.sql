-- Migration: Add password column to oauth_providers table
-- Better Auth stores email/password credentials in the account table
-- with providerId set to 'credential' alongside OAuth provider data
-- This column is required for email/password authentication

ALTER TABLE oauth_providers
ADD COLUMN IF NOT EXISTS password TEXT;

COMMENT ON COLUMN oauth_providers.password IS 'Hashed password for email/password authentication (providerId=credential)';
