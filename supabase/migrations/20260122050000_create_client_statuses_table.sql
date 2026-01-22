-- Migration: Create client_statuses table
-- Description: User-specific client status management for workflow tracking
-- Created: 2026-01-22

-- =============================================================================
-- CLIENT STATUSES TABLE
-- =============================================================================

-- User-specific client statuses
CREATE TABLE client_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'gray',
  position INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Unique status name per user
  CONSTRAINT client_statuses_unique UNIQUE (user_id, name)
);

-- Indexes for client_statuses
CREATE INDEX idx_client_statuses_user_id ON client_statuses(user_id);
CREATE INDEX idx_client_statuses_position ON client_statuses(user_id, position);

-- Add comment for documentation
COMMENT ON TABLE client_statuses IS 'User-specific client statuses for workflow tracking';
COMMENT ON COLUMN client_statuses.position IS 'Order position for display (lower = first)';
COMMENT ON COLUMN client_statuses.is_default IS 'Default statuses cannot be deleted';

-- =============================================================================
-- FUNCTION: Create default statuses for new users
-- =============================================================================

CREATE OR REPLACE FUNCTION create_default_client_statuses()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_statuses (user_id, name, color, position, is_default) VALUES
    (NEW.id, 'New', 'blue', 0, true),
    (NEW.id, 'Contacted', 'purple', 1, true),
    (NEW.id, 'Qualified', 'cyan', 2, true),
    (NEW.id, 'Nurturing', 'orange', 3, true),
    (NEW.id, 'Negotiating', 'yellow', 4, true),
    (NEW.id, 'Won', 'green', 5, true),
    (NEW.id, 'Lost', 'gray', 6, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default statuses when a new user is created
CREATE TRIGGER trigger_create_default_client_statuses
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_client_statuses();

-- =============================================================================
-- INSERT DEFAULT STATUSES FOR EXISTING USERS
-- =============================================================================

INSERT INTO client_statuses (user_id, name, color, position, is_default)
SELECT
  u.id,
  s.name,
  s.color,
  s.position,
  true
FROM users u
CROSS JOIN (VALUES
  ('New', 'blue', 0),
  ('Contacted', 'purple', 1),
  ('Qualified', 'cyan', 2),
  ('Nurturing', 'orange', 3),
  ('Negotiating', 'yellow', 4),
  ('Won', 'green', 5),
  ('Lost', 'gray', 6)
) AS s(name, color, position)
WHERE NOT EXISTS (
  SELECT 1 FROM client_statuses cs WHERE cs.user_id = u.id
);
