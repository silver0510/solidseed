-- Create user_deal_preferences table for tracking which deal types users work with
-- This supports the onboarding flow where users select their deal types

CREATE TABLE user_deal_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  residential_sale_enabled BOOLEAN NOT NULL DEFAULT true,
  mortgage_loan_enabled BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Ensure user_id is unique (one preference record per user)
  CONSTRAINT user_deal_preferences_user_id_unique UNIQUE (user_id),

  -- Business rule: At least one deal type must be enabled
  CONSTRAINT user_deal_preferences_at_least_one_enabled
    CHECK (residential_sale_enabled = true OR mortgage_loan_enabled = true)
);

-- Index for fast user lookups
CREATE INDEX idx_user_deal_preferences_user_id ON user_deal_preferences(user_id);

-- Index for finding users who haven't completed onboarding
CREATE INDEX idx_user_deal_preferences_onboarding ON user_deal_preferences(onboarding_completed);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_deal_preferences_updated_at
  BEFORE UPDATE ON user_deal_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- NOTE: RLS policies removed - authorization handled at application level
-- via Better Auth and service layer (using service role key)

-- Comment for documentation
COMMENT ON TABLE user_deal_preferences IS 'Stores user preferences for enabled deal types. Used for onboarding flow and dashboard filtering.';
COMMENT ON COLUMN user_deal_preferences.residential_sale_enabled IS 'Whether user works with residential sale deals';
COMMENT ON COLUMN user_deal_preferences.mortgage_loan_enabled IS 'Whether user works with mortgage loan deals';
COMMENT ON COLUMN user_deal_preferences.onboarding_completed IS 'Whether user has completed the deal type onboarding screen';
