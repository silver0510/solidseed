-- Migration: Create activity_logs table
-- Description: Track user activities for dashboard and client profile display
-- Created: 2026-01-22

-- =============================================================================
-- ACTIVITY LOGS TABLE
-- =============================================================================

-- Activity tracking for user actions
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_client ON activity_logs(client_id, created_at DESC);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE activity_logs IS 'Track user activities for dashboard and client profile display (30-day retention)';
COMMENT ON COLUMN activity_logs.activity_type IS 'Type of activity: client.created, client.updated, client.status_changed, task.created, task.completed, note.created, document.uploaded, document.downloaded, tag.added, tag.removed';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity: client, task, note, document';
COMMENT ON COLUMN activity_logs.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN activity_logs.client_id IS 'Associated client ID for context (nullable for non-client entities)';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional details like old_status, new_status, client_name, etc.';
