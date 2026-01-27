-- Migration: Refactor Milestones to Checklist System
-- Description:
--   1. Rename deal_milestones table to deal_checklist_items
--   2. Make scheduled_date optional (nullable)
--   3. Remove milestone_type (no longer needed)
--   4. Create user_deal_type_settings table for per-user checklist templates

-- =====================================================
-- Step 1: Create user_deal_type_settings table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_deal_type_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_type_id UUID NOT NULL REFERENCES deal_types(id) ON DELETE CASCADE,
  checklist_template JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one settings record per user per deal type
  UNIQUE(user_id, deal_type_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_deal_type_settings_user_id ON user_deal_type_settings(user_id);
CREATE INDEX idx_user_deal_type_settings_deal_type_id ON user_deal_type_settings(deal_type_id);

-- =====================================================
-- Step 2: Rename deal_milestones to deal_checklist_items
-- =====================================================
ALTER TABLE deal_milestones RENAME TO deal_checklist_items;

-- Rename the sequence
ALTER SEQUENCE IF EXISTS deal_milestones_id_seq RENAME TO deal_checklist_items_id_seq;

-- Rename indexes
ALTER INDEX IF EXISTS idx_deal_milestones_deal_id RENAME TO idx_deal_checklist_items_deal_id;
ALTER INDEX IF EXISTS idx_deal_milestones_status RENAME TO idx_deal_checklist_items_status;

-- =====================================================
-- Step 3: Modify deal_checklist_items structure
-- =====================================================

-- Make scheduled_date nullable (it's already nullable, but we're being explicit)
ALTER TABLE deal_checklist_items
  ALTER COLUMN scheduled_date DROP NOT NULL;

-- Drop milestone_type column (no longer needed for simplified checklist)
ALTER TABLE deal_checklist_items
  DROP COLUMN IF EXISTS milestone_type;

-- =====================================================
-- Step 4: Update RLS policies (if any exist)
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their deal milestones" ON deal_checklist_items;
DROP POLICY IF EXISTS "Users can create milestones for their deals" ON deal_checklist_items;
DROP POLICY IF EXISTS "Users can update their deal milestones" ON deal_checklist_items;
DROP POLICY IF EXISTS "Users can delete their deal milestones" ON deal_checklist_items;

-- Recreate with new names
CREATE POLICY "Users can view their deal checklist items"
  ON deal_checklist_items FOR SELECT
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE assigned_to = auth.uid() AND is_deleted = false
    )
  );

CREATE POLICY "Users can create checklist items for their deals"
  ON deal_checklist_items FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE assigned_to = auth.uid() AND is_deleted = false
    )
  );

CREATE POLICY "Users can update their deal checklist items"
  ON deal_checklist_items FOR UPDATE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE assigned_to = auth.uid() AND is_deleted = false
    )
  );

CREATE POLICY "Users can delete their deal checklist items"
  ON deal_checklist_items FOR DELETE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE assigned_to = auth.uid() AND is_deleted = false
    )
  );

-- =====================================================
-- Step 5: RLS policies for user_deal_type_settings
-- =====================================================

-- Enable RLS
ALTER TABLE user_deal_type_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own settings
CREATE POLICY "Users can view their own deal type settings"
  ON user_deal_type_settings FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own settings
CREATE POLICY "Users can create their own deal type settings"
  ON user_deal_type_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own settings
CREATE POLICY "Users can update their own deal type settings"
  ON user_deal_type_settings FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own settings
CREATE POLICY "Users can delete their own deal type settings"
  ON user_deal_type_settings FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- Step 6: Add helpful comments
-- =====================================================

COMMENT ON TABLE deal_checklist_items IS 'Checklist items for each deal (formerly milestones)';
COMMENT ON TABLE user_deal_type_settings IS 'Per-user default checklist templates for each deal type';
COMMENT ON COLUMN user_deal_type_settings.checklist_template IS 'JSON array of default checklist items: [{ name: string, scheduled_date?: string }]';
