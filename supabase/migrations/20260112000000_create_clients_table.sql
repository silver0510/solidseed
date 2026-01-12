-- Migration: Create clients table
-- Description: Core client profiles for Client Hub with full-text search support
-- Created: 2026-01-12

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================

-- Core client profiles
CREATE TABLE clients (
  id VARCHAR(255) PRIMARY KEY,

  -- Client identity
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  birthday DATE,
  address TEXT,

  -- Search optimization (full-text search vector)
  search_vector TSVECTOR,

  -- Ownership and access control
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  assigned_to VARCHAR(255) NOT NULL REFERENCES users(id),

  -- Soft delete for GDPR compliance
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT clients_email_unique UNIQUE (email),
  CONSTRAINT clients_phone_unique UNIQUE (phone),
  CONSTRAINT clients_phone_format CHECK (phone ~ '^\+1-[0-9]{3}-[0-9]{3}-[0-9]{4}$')
);

-- Indexes for clients
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_is_deleted ON clients(is_deleted);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_search_vector ON clients USING GIN(search_vector);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Trigger function to update search vector
CREATE OR REPLACE FUNCTION clients_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.email, '') || ' ' || COALESCE(NEW.phone, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update updated_at timestamp (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to update search vector
CREATE TRIGGER clients_search_vector_trigger
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION clients_search_vector_update();

-- Trigger to update updated_at timestamp
CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE clients IS 'Core client profiles managed by real estate professionals';
COMMENT ON COLUMN clients.search_vector IS 'Full-text search vector (auto-generated from name, email, phone)';
COMMENT ON COLUMN clients.is_deleted IS 'Soft delete flag for GDPR compliance';
