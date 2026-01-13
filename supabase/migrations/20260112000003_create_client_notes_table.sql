-- Migration: Create client_notes table
-- Description: Activity and interaction notes for clients
-- Created: 2026-01-12

-- =============================================================================
-- CLIENT NOTES TABLE
-- =============================================================================

-- Client notes
CREATE TABLE client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraint for non-empty content
  CONSTRAINT client_notes_content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Indexes for client_notes
CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX idx_client_notes_created_at ON client_notes(created_at);
CREATE INDEX idx_client_notes_is_important ON client_notes(is_important);
CREATE INDEX idx_client_notes_created_by ON client_notes(created_by);

-- Apply updated_at trigger to client_notes
CREATE TRIGGER client_notes_updated_at_trigger
  BEFORE UPDATE ON client_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE client_notes IS 'Activity and interaction notes for clients';
COMMENT ON CONSTRAINT client_notes_content_not_empty ON client_notes IS 'Ensures note content is not empty or whitespace-only';
