-- Migration: Create user_tags table
-- Description: User-defined tag templates for client organization
-- Created: 2026-01-22

-- =============================================================================
-- USER TAGS TABLE
-- =============================================================================

-- User-defined tag templates
CREATE TABLE user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Unique tag name per user
  CONSTRAINT user_tags_unique UNIQUE (user_id, name)
);

-- Indexes for user_tags
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_user_tags_name ON user_tags(name);

-- Add comment for documentation
COMMENT ON TABLE user_tags IS 'User-defined tag templates for client organization';

-- =============================================================================
-- FUNCTION: Create default tags for new users
-- =============================================================================

CREATE OR REPLACE FUNCTION create_default_user_tags()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_tags (user_id, name, color) VALUES
    (NEW.id, 'VIP', 'amber'),
    (NEW.id, 'Hot Lead', 'red'),
    (NEW.id, 'Buyer', 'blue'),
    (NEW.id, 'Seller', 'green'),
    (NEW.id, 'Investor', 'purple'),
    (NEW.id, 'First-Time Buyer', 'cyan'),
    (NEW.id, 'Referral', 'orange'),
    (NEW.id, 'Past Client', 'gray');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default tags when a new user is created
CREATE TRIGGER trigger_create_default_user_tags
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_tags();

-- =============================================================================
-- INSERT DEFAULT TAGS FOR EXISTING USERS
-- =============================================================================

INSERT INTO user_tags (user_id, name, color)
SELECT
  u.id,
  t.name,
  t.color
FROM users u
CROSS JOIN (VALUES
  ('VIP', 'amber'),
  ('Hot Lead', 'red'),
  ('Buyer', 'blue'),
  ('Seller', 'green'),
  ('Investor', 'purple'),
  ('First-Time Buyer', 'cyan'),
  ('Referral', 'orange'),
  ('Past Client', 'gray')
) AS t(name, color)
WHERE NOT EXISTS (
  SELECT 1 FROM user_tags ut WHERE ut.user_id = u.id
);

-- =============================================================================
-- UPDATE CLIENT_TAGS TABLE TO REFERENCE USER_TAGS
-- =============================================================================

-- Add tag_id column to client_tags for referencing user_tags
ALTER TABLE client_tags ADD COLUMN tag_id UUID REFERENCES user_tags(id) ON DELETE CASCADE;

-- Create index for tag_id lookups
CREATE INDEX idx_client_tags_tag_id ON client_tags(tag_id);

-- Add comment for documentation
COMMENT ON COLUMN client_tags.tag_id IS 'Reference to user-defined tag template';
