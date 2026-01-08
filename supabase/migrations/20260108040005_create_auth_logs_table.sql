-- Migration: Create auth_logs table for Korella CRM authentication
-- This table stores authentication events for security auditing
-- Data retention: 7 days (purge job handles cleanup)

CREATE TABLE IF NOT EXISTS auth_logs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Optional foreign key to users table
    -- Nullable for failed login attempts where user doesn't exist
    user_id UUID,

    -- Event type for categorization
    event_type VARCHAR(50) NOT NULL,
    -- Possible values: 'login_success', 'login_fail', 'logout',
    -- 'password_reset_request', 'password_reset_complete', 'password_change',
    -- 'email_verification', 'account_lockout', 'account_unlock',
    -- 'oauth_login', 'oauth_link', 'registration'

    -- Event details
    event_details JSONB,
    -- Flexible storage for event-specific data

    -- Request metadata
    ip_address VARCHAR(45),  -- Supports IPv6 addresses
    user_agent TEXT,
    session_id VARCHAR(255),

    -- Target email (for events without user_id)
    target_email VARCHAR(255),

    -- Success/failure indicator
    success BOOLEAN NOT NULL DEFAULT true,
    failure_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint (nullable)
    CONSTRAINT fk_auth_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- Create indexes for performance optimization
-- Index on user_id for finding logs for a specific user
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);

-- Index on created_at for time-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- Index on event_type for filtering by event type
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON auth_logs(event_type);

-- Composite index for security analysis
CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_event
    ON auth_logs(ip_address, event_type, created_at);

-- Composite index for user activity lookup
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_activity
    ON auth_logs(user_id, event_type, created_at)
    WHERE user_id IS NOT NULL;

-- Index for failed login analysis
CREATE INDEX IF NOT EXISTS idx_auth_logs_failures
    ON auth_logs(ip_address, created_at)
    WHERE success = false;

-- Index on target_email for lookups on failed attempts
CREATE INDEX IF NOT EXISTS idx_auth_logs_target_email
    ON auth_logs(target_email)
    WHERE target_email IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE auth_logs IS 'Authentication event audit log (7-day retention)';
COMMENT ON COLUMN auth_logs.id IS 'Unique identifier (UUID v4)';
COMMENT ON COLUMN auth_logs.user_id IS 'Reference to users table (null for failed lookups)';
COMMENT ON COLUMN auth_logs.event_type IS 'Type of authentication event';
COMMENT ON COLUMN auth_logs.event_details IS 'JSON object with event-specific details';
COMMENT ON COLUMN auth_logs.ip_address IS 'Client IP address';
COMMENT ON COLUMN auth_logs.user_agent IS 'Client user agent string';
COMMENT ON COLUMN auth_logs.session_id IS 'Session identifier if available';
COMMENT ON COLUMN auth_logs.target_email IS 'Email attempted (for failed login lookups)';
COMMENT ON COLUMN auth_logs.success IS 'Whether the operation succeeded';
COMMENT ON COLUMN auth_logs.failure_reason IS 'Reason for failure if success is false';
COMMENT ON COLUMN auth_logs.created_at IS 'Event timestamp';

-- Create event type enum for validation (as a check constraint)
ALTER TABLE auth_logs
ADD CONSTRAINT auth_logs_event_type_check
CHECK (event_type IN (
    'login_success',
    'login_fail',
    'logout',
    'password_reset_request',
    'password_reset_complete',
    'password_change',
    'email_verification',
    'email_verification_resend',
    'account_lockout',
    'account_unlock',
    'oauth_login',
    'oauth_link',
    'oauth_unlink',
    'registration',
    'account_deactivate',
    'account_reactivate'
));

-- Note: Purge job for 7-day retention should be implemented as:
-- DELETE FROM auth_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
-- This can be run via Supabase Edge Functions or a scheduled job
