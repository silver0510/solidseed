-- Migration: Create oauth_providers table for SolidSeed CRM authentication
-- This table maps OAuth provider accounts (Google, Microsoft) to users
-- Enables social login and account linking

CREATE TABLE IF NOT EXISTS oauth_providers (
    -- Primary key (UUID with auto-generation)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to users table
    user_id UUID NOT NULL,

    -- OAuth provider information
    provider VARCHAR(50) NOT NULL,
    -- Possible values: 'google', 'microsoft'
    provider_id VARCHAR(255) NOT NULL,
    -- External user ID from the OAuth provider

    -- OAuth tokens (optional, for API access)
    access_token TEXT,
    refresh_token TEXT,
    access_token_expires_at TIMESTAMPTZ,

    -- OAuth ID token (JWT from provider)
    id_token TEXT,

    -- OAuth scope/permissions
    scope TEXT,

    -- Provider profile data (cached)
    provider_email VARCHAR(255),
    provider_name VARCHAR(255),
    provider_avatar_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_oauth_providers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Composite unique constraint: one provider account per provider
    CONSTRAINT oauth_providers_provider_provider_id_unique
        UNIQUE (provider, provider_id)
);

-- Create indexes for performance optimization
-- Index on user_id for finding all OAuth providers for a user
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON oauth_providers(user_id);

-- Index on provider for filtering by provider type
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider ON oauth_providers(provider);

-- Composite index for provider lookups
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_lookup
    ON oauth_providers(provider, provider_id);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS update_oauth_providers_updated_at ON oauth_providers;
CREATE TRIGGER update_oauth_providers_updated_at
    BEFORE UPDATE ON oauth_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE oauth_providers IS 'OAuth provider account mappings for social login';
COMMENT ON COLUMN oauth_providers.id IS 'UUID primary key (PostgreSQL native, auto-generated)';
COMMENT ON COLUMN oauth_providers.user_id IS 'Reference to users table';
COMMENT ON COLUMN oauth_providers.provider IS 'OAuth provider name (google, microsoft)';
COMMENT ON COLUMN oauth_providers.provider_id IS 'User ID from the OAuth provider';
COMMENT ON COLUMN oauth_providers.access_token IS 'OAuth access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN oauth_providers.refresh_token IS 'OAuth refresh token for token renewal';
COMMENT ON COLUMN oauth_providers.access_token_expires_at IS 'When the access token expires';
COMMENT ON COLUMN oauth_providers.id_token IS 'OAuth ID token (JWT)';
COMMENT ON COLUMN oauth_providers.scope IS 'OAuth scope/permissions';
COMMENT ON COLUMN oauth_providers.provider_email IS 'Email from OAuth provider profile';
COMMENT ON COLUMN oauth_providers.provider_name IS 'Display name from OAuth provider profile';
COMMENT ON COLUMN oauth_providers.provider_avatar_url IS 'Avatar URL from OAuth provider profile';
COMMENT ON COLUMN oauth_providers.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN oauth_providers.updated_at IS 'Record last update timestamp';
