-- Migration: Create email_verifications table for Korella CRM authentication
-- This table stores temporary email verification tokens
-- Tokens expire after 24 hours for security

CREATE TABLE IF NOT EXISTS email_verifications (
    -- Primary key (VARCHAR to support CUID)
    id VARCHAR(255) PRIMARY KEY,

    -- Foreign key to users table
    user_id VARCHAR(255) NOT NULL,

    -- Verification token (secure random string)
    token VARCHAR(255) NOT NULL,

    -- Email being verified (in case user changes email)
    email VARCHAR(255) NOT NULL,

    -- Token expiration (24 hours from creation)
    expires_at TIMESTAMPTZ NOT NULL,

    -- Whether token has been used
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,

    -- Request metadata
    request_ip VARCHAR(45),
    request_user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_email_verifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Unique constraint on token
    CONSTRAINT email_verifications_token_unique UNIQUE (token)
);

-- Create indexes for performance optimization
-- Index on user_id for finding verification tokens for a user
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

-- Index on token for fast token lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);

-- Index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Composite index for valid token lookup
CREATE INDEX IF NOT EXISTS idx_email_verifications_valid
    ON email_verifications(token, expires_at, verified)
    WHERE verified = false;

-- Add comments for documentation
COMMENT ON TABLE email_verifications IS 'Temporary email verification tokens (24-hour expiration)';
COMMENT ON COLUMN email_verifications.id IS 'Unique identifier (CUID)';
COMMENT ON COLUMN email_verifications.user_id IS 'Reference to users table';
COMMENT ON COLUMN email_verifications.token IS 'Secure random token for email verification';
COMMENT ON COLUMN email_verifications.email IS 'Email address being verified';
COMMENT ON COLUMN email_verifications.expires_at IS 'Token expiration time (24 hours from creation)';
COMMENT ON COLUMN email_verifications.verified IS 'Whether email has been verified using this token';
COMMENT ON COLUMN email_verifications.verified_at IS 'When verification was completed';
COMMENT ON COLUMN email_verifications.request_ip IS 'IP address that requested verification';
COMMENT ON COLUMN email_verifications.request_user_agent IS 'User agent that requested verification';
COMMENT ON COLUMN email_verifications.created_at IS 'Record creation timestamp';

-- Create function to set default expiration (24 hours)
CREATE OR REPLACE FUNCTION set_email_verification_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for default expiration
DROP TRIGGER IF EXISTS set_email_verification_expiration_trigger ON email_verifications;
CREATE TRIGGER set_email_verification_expiration_trigger
    BEFORE INSERT ON email_verifications
    FOR EACH ROW
    EXECUTE FUNCTION set_email_verification_expiration();
