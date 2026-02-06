-- Migration: Fix verification.value column length for OAuth state storage
-- Better Auth stores OAuth state data in the value column, which can exceed 255 characters
-- Changing from VARCHAR(255) to TEXT to accommodate longer values

-- Alter the value column to TEXT
ALTER TABLE verification
    ALTER COLUMN value TYPE TEXT;

-- Add comment explaining the change
COMMENT ON COLUMN verification.value IS 'Verification token, code, or OAuth state data (TEXT to accommodate long values)';
