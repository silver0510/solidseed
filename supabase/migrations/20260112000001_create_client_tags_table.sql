-- Migration: Create client_tags table
-- Description: Flexible tagging system for client organization
-- Created: 2026-01-12

-- =============================================================================
-- CLIENT TAGS TABLE
-- =============================================================================

-- Client tags for organization
CREATE TABLE client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Unique tag per client
  CONSTRAINT client_tags_unique UNIQUE (client_id, tag_name)
);

-- Indexes for client_tags
CREATE INDEX idx_client_tags_client_id ON client_tags(client_id);
CREATE INDEX idx_client_tags_tag_name ON client_tags(tag_name);
CREATE INDEX idx_client_tags_created_by ON client_tags(created_by);

-- Add comment for documentation
COMMENT ON TABLE client_tags IS 'Flexible tagging system for client organization';
COMMENT ON CONSTRAINT client_tags_unique ON client_tags IS 'Ensures each tag can only be applied once per client';
