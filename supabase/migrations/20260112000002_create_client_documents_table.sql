-- Migration: Create client_documents table
-- Description: Document storage for client files with size and type constraints
-- Created: 2026-01-12

-- =============================================================================
-- CLIENT DOCUMENTS TABLE
-- =============================================================================

-- Client documents
CREATE TABLE client_documents (
  id VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- File metadata
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  description TEXT,

  -- Audit
  uploaded_by VARCHAR(255) NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT client_documents_file_size_limit CHECK (file_size <= 10485760),
  CONSTRAINT client_documents_file_type_allowed CHECK (
    file_type IN ('application/pdf', 'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'image/jpeg', 'image/png')
  )
);

-- Indexes for client_documents
CREATE INDEX idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX idx_client_documents_uploaded_at ON client_documents(uploaded_at);

-- Add comment for documentation
COMMENT ON TABLE client_documents IS 'Document storage for client files (max 10MB per file)';
COMMENT ON CONSTRAINT client_documents_file_size_limit ON client_documents IS 'Maximum file size of 10MB (10485760 bytes)';
COMMENT ON CONSTRAINT client_documents_file_type_allowed ON client_documents IS 'Allowed file types: PDF, DOC, DOCX, JPG, PNG';
