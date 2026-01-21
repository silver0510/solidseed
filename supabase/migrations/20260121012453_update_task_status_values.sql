-- Migration: Update task status from binary to three-state
-- Description: Changes status from 'pending|completed' to 'todo|in_progress|closed'
-- Created: 2026-01-21T01:24:53Z

-- Step 1: Drop the existing constraint
ALTER TABLE client_tasks DROP CONSTRAINT IF EXISTS client_tasks_status_valid;

-- Step 2: Migrate existing data
UPDATE client_tasks SET status = 'todo' WHERE status = 'pending';
UPDATE client_tasks SET status = 'closed' WHERE status = 'completed';

-- Step 3: Add new constraint with updated values
ALTER TABLE client_tasks
ADD CONSTRAINT client_tasks_status_valid
CHECK (status IN ('todo', 'in_progress', 'closed'));

-- Step 4: Update the default value
ALTER TABLE client_tasks ALTER COLUMN status SET DEFAULT 'todo';

-- Note: We keep 'completed_at' column name for backward compatibility
-- It will be set when status = 'closed' and cleared otherwise
