-- Migration: Add updated_at column to email_verifications table
-- This column is required by Prisma schema but was missing from initial migration

-- Add updated_at column
ALTER TABLE email_verifications
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to auto-update updated_at on row modification
DROP TRIGGER IF EXISTS update_email_verifications_updated_at ON email_verifications;
CREATE TRIGGER update_email_verifications_updated_at
    BEFORE UPDATE ON email_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON COLUMN email_verifications.updated_at IS 'Record last update timestamp';
