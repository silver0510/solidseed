-- Migration: Create client_tasks table
-- Description: Task management with due dates and priorities
-- Created: 2026-01-12

-- =============================================================================
-- CLIENT TASKS TABLE
-- =============================================================================

-- Client tasks
CREATE TABLE client_tasks (
  id VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Task details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,

  -- Ownership
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  assigned_to VARCHAR(255) NOT NULL REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT client_tasks_priority_valid CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT client_tasks_status_valid CHECK (status IN ('pending', 'completed')),
  CONSTRAINT client_tasks_title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- Indexes for client_tasks
CREATE INDEX idx_client_tasks_client_id ON client_tasks(client_id);
CREATE INDEX idx_client_tasks_assigned_to ON client_tasks(assigned_to);
CREATE INDEX idx_client_tasks_due_date ON client_tasks(due_date);
CREATE INDEX idx_client_tasks_status ON client_tasks(status);
CREATE INDEX idx_client_tasks_priority ON client_tasks(priority);

-- Apply updated_at trigger to client_tasks
CREATE TRIGGER client_tasks_updated_at_trigger
  BEFORE UPDATE ON client_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE client_tasks IS 'Task management with due dates and priorities';
COMMENT ON CONSTRAINT client_tasks_priority_valid ON client_tasks IS 'Allowed priorities: low, medium, high';
COMMENT ON CONSTRAINT client_tasks_status_valid ON client_tasks IS 'Allowed statuses: pending, completed';
COMMENT ON CONSTRAINT client_tasks_title_not_empty ON client_tasks IS 'Ensures task title is not empty or whitespace-only';
