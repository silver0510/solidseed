-- Notifications table for in-app alerts
-- Extensible design: free-form type, JSONB metadata, polymorphic entity references
-- Used for task notifications initially, expandable to deals, clients, system alerts

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Extensible type system
  type TEXT NOT NULL,              -- 'task.due_soon', 'task.overdue', 'task.assigned', 'task.completed', 'deal.stage_changed', etc.
  category TEXT NOT NULL DEFAULT 'general', -- 'task', 'deal', 'client', 'system', 'general'

  -- Content
  title TEXT NOT NULL,
  message TEXT,

  -- Polymorphic entity reference (reuses activity_logs pattern)
  entity_type TEXT,               -- 'task', 'deal', 'client'
  entity_id UUID,

  -- Flexible metadata for future types
  metadata JSONB DEFAULT '{}',    -- { client_name, due_date, deal_stage, action_url, task_title }

  -- State
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT notifications_category_check CHECK (category IN ('task', 'deal', 'client', 'system', 'general'))
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Composite index for deduplication (used by lazy evaluation to prevent duplicate due/overdue notifications)
-- Note: Using created_at directly instead of DATE(created_at) since DATE() is not immutable
CREATE INDEX idx_notifications_dedup ON notifications(user_id, type, entity_id, created_at);

-- Table comment
COMMENT ON TABLE notifications IS 'In-app notification system for task alerts, deal updates, and system messages';
COMMENT ON COLUMN notifications.type IS 'Free-form notification type for extensibility without schema migrations';
COMMENT ON COLUMN notifications.category IS 'Grouped category for filtering UI';
COMMENT ON COLUMN notifications.metadata IS 'Type-specific data without schema changes';
COMMENT ON COLUMN notifications.entity_type IS 'Polymorphic reference type (not enforced FK for flexibility)';
COMMENT ON COLUMN notifications.entity_id IS 'Polymorphic reference ID (not enforced FK for flexibility)';
