-- Remove last_active_stage column as it's no longer needed
-- With the new architecture, current_stage always represents the last real position in pipeline
-- Lost deals are tracked via status='closed_lost', not by stage

ALTER TABLE deals
DROP COLUMN IF EXISTS last_active_stage;
