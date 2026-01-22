-- Migration: Add status_id to clients table
-- Description: Link clients to user-defined statuses
-- Created: 2026-01-22

-- =============================================================================
-- ADD STATUS_ID TO CLIENTS TABLE
-- =============================================================================

-- Add status_id column to clients
ALTER TABLE clients ADD COLUMN status_id UUID REFERENCES client_statuses(id) ON DELETE SET NULL;

-- Create index for status lookups
CREATE INDEX idx_clients_status_id ON clients(status_id);

-- Add comment for documentation
COMMENT ON COLUMN clients.status_id IS 'Reference to user-defined client status';
