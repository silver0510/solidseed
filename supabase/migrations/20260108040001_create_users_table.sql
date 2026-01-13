-- Migration: Create users table for Korella CRM authentication
-- This table stores core user account information
-- Compatible with Better Auth library through field mapping

-- Enable UUID extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    -- Primary key (UUID with auto-generation)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core identity fields
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),  -- Nullable for OAuth-only users
    full_name VARCHAR(255) NOT NULL,

    -- Email verification status
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMPTZ,

    -- OAuth profile image URL
    image VARCHAR(500),

    -- Account status and subscription
    account_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Possible values: 'pending', 'active', 'suspended', 'deactivated'
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'trial',
    -- Possible values: 'trial', 'free', 'pro', 'enterprise'
    trial_expires_at TIMESTAMPTZ,

    -- Security: failed login tracking and account lockout
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,

    -- Session tracking
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),  -- Supports IPv6 addresses

    -- Soft delete flag for GDPR compliance
    is_deleted BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint on email
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Create indexes for performance optimization
-- Index on email for fast lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on account_status for filtering active users
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Index on subscription_tier for subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Index on email_verified for filtering verified users
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Index on is_deleted for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);

-- Index on locked_until for checking locked accounts
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Core user accounts for Korella CRM authentication';
COMMENT ON COLUMN users.id IS 'UUID primary key (PostgreSQL native, auto-generated)';
COMMENT ON COLUMN users.email IS 'User email address, used for login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password, null for OAuth-only accounts';
COMMENT ON COLUMN users.full_name IS 'User display name';
COMMENT ON COLUMN users.email_verified IS 'Whether email has been verified';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when email was verified';
COMMENT ON COLUMN users.image IS 'OAuth profile image URL';
COMMENT ON COLUMN users.account_status IS 'Account status: pending, active, suspended, deactivated';
COMMENT ON COLUMN users.subscription_tier IS 'Subscription level: trial, free, pro, enterprise';
COMMENT ON COLUMN users.trial_expires_at IS 'When trial period ends (14 days from verification)';
COMMENT ON COLUMN users.failed_login_count IS 'Failed login attempts counter (resets on success)';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this time (after 5 failed attempts)';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.last_login_ip IS 'IP address of last successful login';
COMMENT ON COLUMN users.is_deleted IS 'Soft delete flag for GDPR compliance';
COMMENT ON COLUMN users.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Record last update timestamp';
