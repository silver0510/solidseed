-- Migration: Create Client Hub RLS policies
-- Description: Row Level Security policies for all Client Hub tables
-- Created: 2026-01-12

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all client-related tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CLIENTS RLS POLICIES
-- =============================================================================

-- Clients: Users can only access clients assigned to them
CREATE POLICY clients_select_policy ON clients
  FOR SELECT USING (
    assigned_to = auth.uid() AND is_deleted = FALSE
  );

CREATE POLICY clients_insert_policy ON clients
  FOR INSERT WITH CHECK (
    assigned_to = auth.uid() AND created_by = auth.uid()
  );

CREATE POLICY clients_update_policy ON clients
  FOR UPDATE USING (
    assigned_to = auth.uid() AND is_deleted = FALSE
  );

CREATE POLICY clients_delete_policy ON clients
  FOR DELETE USING (
    assigned_to = auth.uid()
  );

-- =============================================================================
-- CLIENT TAGS RLS POLICIES
-- =============================================================================

-- Client tags: Access through client ownership
CREATE POLICY client_tags_select_policy ON client_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_tags.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
  );

CREATE POLICY client_tags_insert_policy ON client_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_tags.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
    AND created_by = auth.uid()
  );

CREATE POLICY client_tags_delete_policy ON client_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_tags.client_id AND clients.assigned_to = auth.uid())
  );

-- =============================================================================
-- CLIENT DOCUMENTS RLS POLICIES
-- =============================================================================

-- Client documents: Access through client ownership
CREATE POLICY client_documents_select_policy ON client_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_documents.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
  );

CREATE POLICY client_documents_insert_policy ON client_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_documents.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
    AND uploaded_by = auth.uid()
  );

CREATE POLICY client_documents_delete_policy ON client_documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_documents.client_id AND clients.assigned_to = auth.uid())
  );

-- =============================================================================
-- CLIENT NOTES RLS POLICIES
-- =============================================================================

-- Client notes: Access through client ownership
CREATE POLICY client_notes_select_policy ON client_notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_notes.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
  );

CREATE POLICY client_notes_insert_policy ON client_notes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_notes.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
    AND created_by = auth.uid()
  );

CREATE POLICY client_notes_update_policy ON client_notes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_notes.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
    AND created_by = auth.uid()
  );

CREATE POLICY client_notes_delete_policy ON client_notes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_notes.client_id AND clients.assigned_to = auth.uid())
    AND created_by = auth.uid()
  );

-- =============================================================================
-- CLIENT TASKS RLS POLICIES
-- =============================================================================

-- Client tasks: Access through assignment or client ownership
CREATE POLICY client_tasks_select_policy ON client_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_tasks.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
  );

CREATE POLICY client_tasks_insert_policy ON client_tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_tasks.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
    AND created_by = auth.uid()
  );

CREATE POLICY client_tasks_update_policy ON client_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_tasks.client_id AND clients.assigned_to = auth.uid() AND clients.is_deleted = FALSE)
  );

CREATE POLICY client_tasks_delete_policy ON client_tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_tasks.client_id AND clients.assigned_to = auth.uid())
    AND created_by = auth.uid()
  );

-- Add comments for documentation
COMMENT ON POLICY clients_select_policy ON clients IS 'Users can only view clients assigned to them that are not deleted';
COMMENT ON POLICY clients_insert_policy ON clients IS 'Users can only create clients for themselves (both created_by and assigned_to)';
COMMENT ON POLICY clients_update_policy ON clients IS 'Users can only update clients assigned to them that are not deleted';
COMMENT ON POLICY clients_delete_policy ON clients IS 'Users can only delete (soft delete) clients assigned to them';
