-- Migration: Fix Client Hub RLS policies for UUID compatibility
-- Description: Remove ::TEXT casts from auth.uid() - columns are now UUID type
-- Created: 2026-01-15

-- =============================================================================
-- DROP EXISTING POLICIES (with ::TEXT casts)
-- =============================================================================

-- Clients table
DROP POLICY IF EXISTS clients_select_policy ON clients;
DROP POLICY IF EXISTS clients_insert_policy ON clients;
DROP POLICY IF EXISTS clients_update_policy ON clients;
DROP POLICY IF EXISTS clients_delete_policy ON clients;

-- Client tags table
DROP POLICY IF EXISTS client_tags_select_policy ON client_tags;
DROP POLICY IF EXISTS client_tags_insert_policy ON client_tags;
DROP POLICY IF EXISTS client_tags_delete_policy ON client_tags;

-- Client documents table
DROP POLICY IF EXISTS client_documents_select_policy ON client_documents;
DROP POLICY IF EXISTS client_documents_insert_policy ON client_documents;
DROP POLICY IF EXISTS client_documents_delete_policy ON client_documents;

-- Client notes table
DROP POLICY IF EXISTS client_notes_select_policy ON client_notes;
DROP POLICY IF EXISTS client_notes_insert_policy ON client_notes;
DROP POLICY IF EXISTS client_notes_update_policy ON client_notes;
DROP POLICY IF EXISTS client_notes_delete_policy ON client_notes;

-- Client tasks table
DROP POLICY IF EXISTS client_tasks_select_policy ON client_tasks;
DROP POLICY IF EXISTS client_tasks_insert_policy ON client_tasks;
DROP POLICY IF EXISTS client_tasks_update_policy ON client_tasks;
DROP POLICY IF EXISTS client_tasks_delete_policy ON client_tasks;

-- =============================================================================
-- RECREATE CLIENTS RLS POLICIES (UUID compatible)
-- =============================================================================

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
-- RECREATE CLIENT TAGS RLS POLICIES (UUID compatible)
-- =============================================================================

CREATE POLICY client_tags_select_policy ON client_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_tags.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
  );

CREATE POLICY client_tags_insert_policy ON client_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_tags.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
    AND created_by = auth.uid()
  );

CREATE POLICY client_tags_delete_policy ON client_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_tags.client_id
      AND clients.assigned_to = auth.uid()
    )
  );

-- =============================================================================
-- RECREATE CLIENT DOCUMENTS RLS POLICIES (UUID compatible)
-- =============================================================================

CREATE POLICY client_documents_select_policy ON client_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_documents.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
  );

CREATE POLICY client_documents_insert_policy ON client_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_documents.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY client_documents_delete_policy ON client_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_documents.client_id
      AND clients.assigned_to = auth.uid()
    )
  );

-- =============================================================================
-- RECREATE CLIENT NOTES RLS POLICIES (UUID compatible)
-- =============================================================================

CREATE POLICY client_notes_select_policy ON client_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_notes.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
  );

CREATE POLICY client_notes_insert_policy ON client_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_notes.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
    AND created_by = auth.uid()
  );

CREATE POLICY client_notes_update_policy ON client_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_notes.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
    AND created_by = auth.uid()
  );

CREATE POLICY client_notes_delete_policy ON client_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_notes.client_id
      AND clients.assigned_to = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- =============================================================================
-- RECREATE CLIENT TASKS RLS POLICIES (UUID compatible)
-- =============================================================================

CREATE POLICY client_tasks_select_policy ON client_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_tasks.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
  );

CREATE POLICY client_tasks_insert_policy ON client_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_tasks.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
    AND created_by = auth.uid()
  );

CREATE POLICY client_tasks_update_policy ON client_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_tasks.client_id
      AND clients.assigned_to = auth.uid()
      AND clients.is_deleted = FALSE
    )
  );

CREATE POLICY client_tasks_delete_policy ON client_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_tasks.client_id
      AND clients.assigned_to = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- =============================================================================
-- UPDATE COMMENTS
-- =============================================================================

COMMENT ON POLICY clients_select_policy ON clients IS 'Users can only view clients assigned to them (UUID comparison)';
COMMENT ON POLICY clients_insert_policy ON clients IS 'Users can only create clients for themselves (UUID comparison)';
COMMENT ON POLICY clients_update_policy ON clients IS 'Users can only update clients assigned to them (UUID comparison)';
COMMENT ON POLICY clients_delete_policy ON clients IS 'Users can only delete clients assigned to them (UUID comparison)';
