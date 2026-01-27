-- Add last_active_stage column to track the stage before deal was lost
-- This allows us to show where the deal was in the pipeline before it was marked as lost

ALTER TABLE deals
ADD COLUMN last_active_stage VARCHAR(50);

COMMENT ON COLUMN deals.last_active_stage IS 'The stage the deal was in before being marked as lost (for display purposes)';
