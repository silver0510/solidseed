-- Migration: Create verification table for Better Auth
-- This table stores verification tokens for email verification, password reset, and OAuth state
-- Required by Better Auth library

CREATE TABLE IF NOT EXISTS verification (
    -- Primary key (UUID with auto-generation)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identifier being verified (email, phone, etc.)
    identifier VARCHAR(255) NOT NULL,

    -- Verification token/code
    value VARCHAR(255) NOT NULL,

    -- Expiration timestamp
    expires_at TIMESTAMPTZ NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
-- Index on identifier for looking up verification records
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);

-- Index on expires_at for cleanup of expired records
CREATE INDEX IF NOT EXISTS idx_verification_expires_at ON verification(expires_at);

-- Composite index for identifier + value lookups
CREATE INDEX IF NOT EXISTS idx_verification_identifier_value
    ON verification(identifier, value);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS update_verification_updated_at ON verification;
CREATE TRIGGER update_verification_updated_at
    BEFORE UPDATE ON verification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE verification IS 'Verification tokens for email, password reset, and OAuth state';
COMMENT ON COLUMN verification.id IS 'UUID primary key (PostgreSQL native, auto-generated)';
COMMENT ON COLUMN verification.identifier IS 'Email or other identifier being verified';
COMMENT ON COLUMN verification.value IS 'Verification token or code';
COMMENT ON COLUMN verification.expires_at IS 'When the verification token expires';
COMMENT ON COLUMN verification.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN verification.updated_at IS 'Record last update timestamp';
