-- Migration: Create password_resets table for SolidSeed CRM authentication
-- This table stores temporary password reset tokens
-- Tokens expire after 1 hour for security

CREATE TABLE IF NOT EXISTS password_resets (
    -- Primary key (UUID with auto-generation)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to users table
    user_id UUID NOT NULL,

    -- Reset token (secure random string)
    token VARCHAR(255) NOT NULL,

    -- Token expiration (1 hour from creation)
    expires_at TIMESTAMPTZ NOT NULL,

    -- Whether token has been used
    used BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMPTZ,

    -- Request metadata for security logging
    request_ip VARCHAR(45),
    request_user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_password_resets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Unique constraint on token
    CONSTRAINT password_resets_token_unique UNIQUE (token)
);

-- Create indexes for performance optimization
-- Index on user_id for finding reset tokens for a user
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);

-- Index on token for fast token lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

-- Index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- Composite index for valid token lookup
CREATE INDEX IF NOT EXISTS idx_password_resets_valid
    ON password_resets(token, expires_at, used)
    WHERE used = false;

-- Add comments for documentation
COMMENT ON TABLE password_resets IS 'Temporary password reset tokens (1-hour expiration)';
COMMENT ON COLUMN password_resets.id IS 'UUID primary key (PostgreSQL native, auto-generated)';
COMMENT ON COLUMN password_resets.user_id IS 'Reference to users table';
COMMENT ON COLUMN password_resets.token IS 'Secure random token for password reset';
COMMENT ON COLUMN password_resets.expires_at IS 'Token expiration time (1 hour from creation)';
COMMENT ON COLUMN password_resets.used IS 'Whether token has been used';
COMMENT ON COLUMN password_resets.used_at IS 'When token was used';
COMMENT ON COLUMN password_resets.request_ip IS 'IP address that requested the reset';
COMMENT ON COLUMN password_resets.request_user_agent IS 'User agent that requested the reset';
COMMENT ON COLUMN password_resets.created_at IS 'Record creation timestamp';

-- Create function to set default expiration (1 hour)
CREATE OR REPLACE FUNCTION set_password_reset_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = CURRENT_TIMESTAMP + INTERVAL '1 hour';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for default expiration
DROP TRIGGER IF EXISTS set_password_reset_expiration_trigger ON password_resets;
CREATE TRIGGER set_password_reset_expiration_trigger
    BEFORE INSERT ON password_resets
    FOR EACH ROW
    EXECUTE FUNCTION set_password_reset_expiration();
