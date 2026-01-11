-- Migration: Create sessions table for Better Auth
-- This table stores session information for authentication
-- Note: With storeSessionInDatabase: false, sessions are stored in JWT cookies
-- However, Better Auth still requires this table for session model validation

CREATE TABLE IF NOT EXISTS sessions (
    -- Primary key (VARCHAR to support CUID from Better Auth)
    id VARCHAR(255) PRIMARY KEY,

    -- Foreign key to users table
    user_id VARCHAR(255) NOT NULL,

    -- Session token (unique identifier)
    token VARCHAR(255) NOT NULL UNIQUE,

    -- Expiration timestamp
    expires_at TIMESTAMPTZ NOT NULL,

    -- Optional session metadata
    ip_address VARCHAR(45),  -- Supports IPv6 addresses
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes for performance optimization
-- Index on user_id for finding all sessions for a user
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Index on token for session lookup (unique index already exists)
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Index on expires_at for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE sessions IS 'User sessions for authentication (JWT-based, minimal DB usage)';
COMMENT ON COLUMN sessions.id IS 'Unique identifier (CUID)';
COMMENT ON COLUMN sessions.user_id IS 'Reference to users table';
COMMENT ON COLUMN sessions.token IS 'Session token (matches JWT)';
COMMENT ON COLUMN sessions.expires_at IS 'When the session expires';
COMMENT ON COLUMN sessions.ip_address IS 'IP address of session creation';
COMMENT ON COLUMN sessions.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN sessions.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN sessions.updated_at IS 'Record last update timestamp';
