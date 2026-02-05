---
name: client-hub
status: in-progress
created: 2026-01-12T04:02:10Z
progress: 42%
prd: .claude/prds/client-hub.md
github: [Will be updated when synced to GitHub]
---

# Epic: Client Hub

## Overview

Client Hub is the centralized client management platform for SolidSeed CRM, enabling real estate professionals to manage client profiles, documents, notes, and tasks from a mobile-first interface. The implementation leverages the existing Better Auth authentication system, Supabase PostgreSQL database, and Supabase Storage for document management, with a focus on data portability and GDPR compliance.

## Architecture Decisions

### 1. Supabase Storage for Document Management

**Decision**: Use Supabase Storage with signed URLs for document storage instead of direct S3 integration.

**Rationale**:
- Native integration with existing Supabase PostgreSQL database
- Built-in Row Level Security (RLS) policies for access control
- Signed URLs provide secure, time-limited access to documents
- Simplified infrastructure - no separate AWS account needed

**Trade-offs**:
- Limited to Supabase storage limits on free/pro tiers
- Less flexibility than raw S3 for advanced features
- Mitigation: Supabase storage is built on S3 and scales well

### 2. Row Level Security (RLS) for Data Isolation

**Decision**: Implement PostgreSQL RLS policies on all client-related tables to enforce agent-level data isolation.

**Rationale**:
- Database-level security ensures data isolation regardless of application bugs
- Simplifies application code - no need for manual ownership checks
- Audit-friendly - security rules are declarative and reviewable
- Native Supabase support with JWT token integration

**Trade-offs**:
- Slightly more complex queries for admin operations
- Requires careful policy design to avoid performance issues
- Mitigation: Use efficient indexes and test RLS performance

### 3. Server-Side Pagination with Cursor-Based Navigation

**Decision**: Use cursor-based pagination for client lists instead of offset pagination.

**Rationale**:
- Better performance with large datasets (1000+ clients per agent)
- Consistent results even when data changes during pagination
- Supports infinite scroll UX pattern for mobile

**Trade-offs**:
- Cannot jump to arbitrary pages
- More complex implementation than offset pagination
- Mitigation: Users rarely need to jump to specific pages; search is preferred

### 4. Soft Delete with Audit Trail

**Decision**: Implement soft delete via `is_deleted` flag with comprehensive audit logging.

**Rationale**:
- GDPR compliance - can restore accidentally deleted data
- Maintains referential integrity with related records
- Enables audit trail for compliance and debugging
- Data can be permanently purged via scheduled job

**Trade-offs**:
- Requires filtering `is_deleted = false` in all queries
- Storage overhead for "deleted" records
- Mitigation: RLS policies automatically filter deleted records; scheduled purge after retention period

### 5. Real-Time Search with PostgreSQL Full-Text Search

**Decision**: Use PostgreSQL `tsvector` and `ts_rank` for client search instead of external search service.

**Rationale**:
- No additional infrastructure required
- Good performance for expected data volumes (5000 clients per agent)
- Built-in trigram support for partial matching
- Native Supabase integration

**Trade-offs**:
- Less sophisticated than Elasticsearch/Algolia
- May need optimization for very large datasets
- Mitigation: GIN indexes and materialized search vectors; can migrate to external service later if needed

## Implementation Guide

### Database Schema

**Reference**: See `.claude/database/database.dbml` for existing schema and conventions.

**Existing Tables Used**:
- `users` - Agent accounts (foreign key references for `created_by`, `assigned_to`)

**New Tables** (follow conventions from database.dbml):

```sql
-- =============================================================================
-- CLIENT HUB TABLES
-- =============================================================================

-- Core client profiles
CREATE TABLE clients (
  id VARCHAR(255) PRIMARY KEY,

  -- Client identity
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  birthday DATE,
  address TEXT,

  -- Search optimization (full-text search vector)
  search_vector TSVECTOR,

  -- Ownership and access control
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  assigned_to VARCHAR(255) NOT NULL REFERENCES users(id),

  -- Soft delete for GDPR compliance
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT clients_email_unique UNIQUE (email),
  CONSTRAINT clients_phone_unique UNIQUE (phone),
  CONSTRAINT clients_phone_format CHECK (phone ~ '^\+1-[0-9]{3}-[0-9]{3}-[0-9]{4}$')
);

-- Indexes for clients
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_is_deleted ON clients(is_deleted);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_search_vector ON clients USING GIN(search_vector);

-- Trigger to update search vector
CREATE OR REPLACE FUNCTION clients_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.email, '') || ' ' || COALESCE(NEW.phone, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_search_vector_trigger
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION clients_search_vector_update();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Client tags for organization
CREATE TABLE client_tags (
  id VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Unique tag per client
  CONSTRAINT client_tags_unique UNIQUE (client_id, tag_name)
);

-- Indexes for client_tags
CREATE INDEX idx_client_tags_client_id ON client_tags(client_id);
CREATE INDEX idx_client_tags_tag_name ON client_tags(tag_name);
CREATE INDEX idx_client_tags_created_by ON client_tags(created_by);

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

-- Client notes
CREATE TABLE client_notes (
  id VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraint for non-empty content
  CONSTRAINT client_notes_content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Indexes for client_notes
CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX idx_client_notes_created_at ON client_notes(created_at);
CREATE INDEX idx_client_notes_is_important ON client_notes(is_important);
CREATE INDEX idx_client_notes_created_by ON client_notes(created_by);

-- Apply updated_at trigger to client_notes
CREATE TRIGGER client_notes_updated_at_trigger
  BEFORE UPDATE ON client_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all client-related tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

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
```

**DBML Addition** (to be added to database.dbml):

```dbml
// =============================================================================
// CLIENT HUB TABLES
// =============================================================================

// Core client profiles managed by real estate professionals
Table clients {
  id varchar(255) [pk, note: 'Unique identifier (CUID)']

  // Client identity
  name varchar(255) [not null, note: 'Client full name']
  email varchar(255) [not null, unique, note: 'Client email address']
  phone varchar(50) [not null, unique, note: 'Phone in +1-XXX-XXX-XXXX format']
  birthday date [note: 'Client birthday for relationship building']
  address text [note: 'Client mailing/home address']

  // Search optimization
  search_vector tsvector [note: 'Full-text search vector (auto-generated)']

  // Ownership and access control
  created_by varchar(255) [not null, ref: > users.id, note: 'User who created the client']
  assigned_to varchar(255) [not null, ref: > users.id, note: 'Agent assigned to client']

  // Soft delete
  is_deleted boolean [not null, default: false, note: 'Soft delete flag for GDPR']

  // Timestamps
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    assigned_to [name: 'idx_clients_assigned_to']
    is_deleted [name: 'idx_clients_is_deleted']
    created_at [name: 'idx_clients_created_at']
    email [name: 'idx_clients_email']
    phone [name: 'idx_clients_phone']
    search_vector [name: 'idx_clients_search_vector', type: GIN]
  }

  note: 'Core client profiles managed by real estate professionals'
}

// Flexible tagging system for client organization
Table client_tags {
  id varchar(255) [pk, note: 'Unique identifier (CUID)']
  client_id varchar(255) [not null, ref: > clients.id, note: 'Reference to client']
  tag_name varchar(100) [not null, note: 'Tag label']
  created_by varchar(255) [not null, ref: > users.id, note: 'User who created tag']
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    client_id [name: 'idx_client_tags_client_id']
    tag_name [name: 'idx_client_tags_tag_name']
    (client_id, tag_name) [unique, name: 'idx_client_tags_unique']
  }

  note: 'Flexible tagging system for client organization'
}

// Document storage for client files
Table client_documents {
  id varchar(255) [pk, note: 'Unique identifier (CUID)']
  client_id varchar(255) [not null, ref: > clients.id, note: 'Reference to client']

  // File metadata
  file_name varchar(255) [not null, note: 'Original filename']
  file_path text [not null, unique, note: 'Supabase Storage path']
  file_size integer [not null, note: 'File size in bytes (max 10MB)']
  file_type varchar(50) [not null, note: 'MIME type']
  description text [note: 'Document description']

  // Audit
  uploaded_by varchar(255) [not null, ref: > users.id, note: 'User who uploaded']
  uploaded_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    client_id [name: 'idx_client_documents_client_id']
    uploaded_at [name: 'idx_client_documents_uploaded_at']
  }

  note: 'Document storage for client files (max 10MB per file)'
}

// Activity and interaction notes
Table client_notes {
  id varchar(255) [pk, note: 'Unique identifier (CUID)']
  client_id varchar(255) [not null, ref: > clients.id, note: 'Reference to client']
  content text [not null, note: 'Note content (min 1 char)']
  is_important boolean [not null, default: false, note: 'Important flag for highlighting']
  created_by varchar(255) [not null, ref: > users.id, note: 'User who created note']
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    client_id [name: 'idx_client_notes_client_id']
    created_at [name: 'idx_client_notes_created_at']
    is_important [name: 'idx_client_notes_is_important']
  }

  note: 'Activity and interaction notes for clients'
}

// Task management with due dates and priorities
Table client_tasks {
  id varchar(255) [pk, note: 'Unique identifier (CUID)']
  client_id varchar(255) [not null, ref: > clients.id, note: 'Reference to client']

  // Task details
  title varchar(255) [not null, note: 'Task title']
  description text [note: 'Task description']
  due_date date [not null, note: 'Task due date']
  priority varchar(20) [not null, default: 'medium', note: 'Priority: low, medium, high']
  status varchar(20) [not null, default: 'pending', note: 'Status: pending, completed']
  completed_at timestamptz [note: 'When task was completed']

  // Ownership
  created_by varchar(255) [not null, ref: > users.id, note: 'User who created task']
  assigned_to varchar(255) [not null, ref: > users.id, note: 'User assigned to task']

  // Timestamps
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    client_id [name: 'idx_client_tasks_client_id']
    assigned_to [name: 'idx_client_tasks_assigned_to']
    due_date [name: 'idx_client_tasks_due_date']
    status [name: 'idx_client_tasks_status']
    priority [name: 'idx_client_tasks_priority']
  }

  note: 'Task management with due dates and priorities'
}

TableGroup client_hub {
  clients
  client_tags
  client_documents
  client_notes
  client_tasks
}
```

### API Endpoints

**POST /api/clients**
- **Purpose**: Create a new client
- **Request Body**:
  ```json
  {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "birthday": "1985-03-15",
    "address": "123 Main St, Austin, TX 78701"
  }
  ```
- **Validation**: Name required, email format, phone format (+1-XXX-XXX-XXXX), unique email/phone
- **Response Success (201)**:
  ```json
  {
    "id": "clx123abc...",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "birthday": "1985-03-15",
    "address": "123 Main St, Austin, TX 78701",
    "created_at": "2026-01-12T04:00:00Z"
  }
  ```
- **Response Error (400)**:
  ```json
  {
    "error": "Validation failed",
    "details": { "email": "Email already exists" }
  }
  ```

**GET /api/clients**
- **Purpose**: List clients with pagination and search
- **Query Parameters**: `cursor`, `limit` (default 20, max 100), `search`, `tag`, `sort` (created_at, name)
- **Response Success (200)**:
  ```json
  {
    "data": [{ "id": "...", "name": "...", "email": "...", "tags": [...] }],
    "next_cursor": "clx456def...",
    "total_count": 150
  }
  ```

**GET /api/clients/:id**
- **Purpose**: Get client profile with related data
- **Response Success (200)**:
  ```json
  {
    "id": "clx123abc...",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "birthday": "1985-03-15",
    "address": "123 Main St, Austin, TX 78701",
    "tags": ["Buyer", "Hot Lead"],
    "notes_count": 5,
    "tasks_count": 2,
    "documents_count": 3,
    "created_at": "2026-01-12T04:00:00Z",
    "updated_at": "2026-01-12T04:00:00Z"
  }
  ```

**PATCH /api/clients/:id**
- **Purpose**: Update client profile
- **Request Body**: Partial client fields
- **Response Success (200)**: Updated client object

**DELETE /api/clients/:id**
- **Purpose**: Soft delete client (sets is_deleted = true)
- **Response Success (204)**: No content

**POST /api/clients/:id/tags**
- **Purpose**: Add tag to client
- **Request Body**: `{ "tag_name": "Hot Lead" }`
- **Response Success (201)**: Tag object

**DELETE /api/clients/:id/tags/:tagId**
- **Purpose**: Remove tag from client
- **Response Success (204)**: No content

**POST /api/clients/:id/documents**
- **Purpose**: Upload document (multipart/form-data)
- **Form Fields**: `file`, `description`
- **Validation**: File type (PDF, DOC, DOCX, JPG, PNG), max 10MB
- **Response Success (201)**: Document object with signed URL

**GET /api/clients/:id/documents/:docId/download**
- **Purpose**: Get signed download URL
- **Response Success (200)**: `{ "url": "https://...", "expires_in": 3600 }`

**DELETE /api/clients/:id/documents/:docId**
- **Purpose**: Delete document from storage and database
- **Response Success (204)**: No content

**POST /api/clients/:id/notes**
- **Purpose**: Create note
- **Request Body**: `{ "content": "Met at open house...", "is_important": false }`
- **Response Success (201)**: Note object

**PATCH /api/clients/:id/notes/:noteId**
- **Purpose**: Update note
- **Response Success (200)**: Updated note object

**DELETE /api/clients/:id/notes/:noteId**
- **Purpose**: Delete note
- **Response Success (204)**: No content

**POST /api/clients/:id/tasks**
- **Purpose**: Create task
- **Request Body**:
  ```json
  {
    "title": "Follow up on property preferences",
    "description": "Discuss budget and location preferences",
    "due_date": "2026-01-15",
    "priority": "high"
  }
  ```
- **Response Success (201)**: Task object

**PATCH /api/clients/:id/tasks/:taskId**
- **Purpose**: Update task (including status changes)
- **Response Success (200)**: Updated task object (with completed_at if status=completed)

**DELETE /api/clients/:id/tasks/:taskId**
- **Purpose**: Delete task
- **Response Success (204)**: No content

**GET /api/tasks**
- **Purpose**: Get all tasks for current user (task dashboard)
- **Query Parameters**: `status`, `priority`, `due_before`, `due_after`
- **Response Success (200)**: Array of tasks with client info

**POST /api/clients/import**
- **Purpose**: Bulk import clients from CSV
- **Request Body**: multipart/form-data with CSV file
- **Response Success (200)**:
  ```json
  {
    "imported": 45,
    "failed": 3,
    "errors": [
      { "row": 12, "error": "Invalid phone format" }
    ]
  }
  ```

**GET /api/clients/export**
- **Purpose**: Export clients to CSV
- **Query Parameters**: `tags` (filter), `format` (csv)
- **Response Success (200)**: CSV file download

### Supabase Storage Configuration

**Bucket**: `client-documents`

```typescript
// Create storage bucket (run once via Supabase dashboard or migration)
// Bucket settings:
// - Public: false
// - File size limit: 10MB
// - Allowed MIME types: application/pdf, application/msword,
//   application/vnd.openxmlformats-officedocument.wordprocessingml.document,
//   image/jpeg, image/png

// Storage RLS Policy (in Supabase SQL Editor)
CREATE POLICY "Users can upload documents for their clients"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = (storage.foldername(name))[1]
    AND clients.assigned_to = auth.uid()
    AND clients.is_deleted = FALSE
  )
);

CREATE POLICY "Users can read documents for their clients"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = (storage.foldername(name))[1]
    AND clients.assigned_to = auth.uid()
    AND clients.is_deleted = FALSE
  )
);

CREATE POLICY "Users can delete documents for their clients"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = (storage.foldername(name))[1]
    AND clients.assigned_to = auth.uid()
  )
);
```

**File path structure**: `{client_id}/{document_id}/{original_filename}`

### Frontend Components

**Component: ClientList**
- Purpose: Display paginated list of clients with search and tag filtering
- Props: None (uses React Query for data fetching)
- State: Search query, selected tags, sort order
- Key features: Infinite scroll, real-time search (debounced 300ms), tag chips
- Mobile: Card layout with touch-friendly tap targets (44x44px minimum)

**Component: ClientProfile**
- Purpose: Display full client profile with tabs for documents, notes, tasks
- Props: `{ clientId: string }`
- State: Active tab, editing mode
- Tabs: Overview, Documents, Notes, Tasks
- Mobile: Bottom tab navigation, swipe between sections

**Component: ClientForm**
- Purpose: Create/edit client form with validation
- Props: `{ client?: Client, onSubmit: (data) => void }`
- Validation: Zod schema matching API requirements
- Mobile: Full-screen modal, keyboard-aware input positioning

**Component: DocumentUploader**
- Purpose: Upload documents with drag-drop and progress
- Props: `{ clientId: string, onUpload: (doc) => void }`
- Features: File type validation, size validation, progress indicator
- Mobile: Camera/file picker integration

**Component: NoteEditor**
- Purpose: Create/edit notes with importance toggle
- Props: `{ clientId: string, note?: Note }`
- Features: Auto-save draft, importance star toggle

**Component: TaskCard**
- Purpose: Display task with quick status toggle
- Props: `{ task: Task, onStatusChange: (status) => void }`
- Visual: Color-coded priority and due date (red=overdue, yellow=today)
- Mobile: Swipe actions for complete/delete

**Component: TaskDashboard**
- Purpose: Agent's task overview across all clients
- Features: Filter by status/priority, grouped by due date
- Mobile: List view with pull-to-refresh

**Component: CSVImporter**
- Purpose: Bulk import wizard with preview and error handling
- Steps: Upload → Preview → Confirm → Results
- Features: Download template, error log export

### Service Integration Code

**Service: ClientService**

```typescript
import { createClient } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class ClientService {
  // Create a new client
  async createClient(data: CreateClientInput): Promise<Client> {
    const id = createId();
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        id,
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        assigned_to: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return client;
  }

  // List clients with cursor pagination
  async listClients(params: ListClientsParams): Promise<PaginatedClients> {
    let query = supabase
      .from('clients')
      .select('*, client_tags(tag_name)', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(params.limit || 20);

    if (params.cursor) {
      query = query.lt('created_at', params.cursor);
    }

    if (params.search) {
      query = query.textSearch('search_vector', params.search);
    }

    if (params.tag) {
      query = query.contains('client_tags.tag_name', [params.tag]);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: data || [],
      next_cursor: data?.length ? data[data.length - 1].created_at : null,
      total_count: count || 0,
    };
  }

  // Search clients with full-text search
  async searchClients(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone')
      .eq('is_deleted', false)
      .textSearch('search_vector', query)
      .limit(10);

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Soft delete client
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
```

**Service: DocumentService**

```typescript
export class DocumentService {
  // Upload document to Supabase Storage
  async uploadDocument(
    clientId: string,
    file: File,
    description?: string
  ): Promise<ClientDocument> {
    const documentId = createId();
    const filePath = `${clientId}/${documentId}/${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // Create database record
    const { data, error } = await supabase
      .from('client_documents')
      .insert({
        id: documentId,
        client_id: clientId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        description,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      // Rollback storage upload on DB error
      await supabase.storage.from('client-documents').remove([filePath]);
      throw new Error(error.message);
    }

    return data;
  }

  // Get signed URL for document download
  async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw new Error(error.message);
    return data.signedUrl;
  }

  // Delete document from storage and database
  async deleteDocument(documentId: string, filePath: string): Promise<void> {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('client-documents')
      .remove([filePath]);

    if (storageError) throw new Error(storageError.message);

    // Delete database record
    const { error } = await supabase
      .from('client_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw new Error(error.message);
  }
}
```

## Third-Party Setup

### Supabase Storage Setup

**Prerequisites**:
- Supabase project already configured (from user-authentication epic)
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`

**Step 1: Create Storage Bucket**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `client-documents`
4. Public bucket: OFF (unchecked)
5. File size limit: 10MB (10485760 bytes)
6. Allowed MIME types: `application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png`
7. Click "Create bucket"

**Step 2: Configure Storage RLS Policies**
1. Navigate to Storage → Policies
2. Click "New policy" for `client-documents` bucket
3. Add policies from "Supabase Storage Configuration" section above

**Step 3: Test Storage**
```bash
# Test upload (requires authenticated session)
curl -X POST "https://your-project.supabase.co/storage/v1/object/client-documents/test/test.pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf"
```

Expected result: `{ "Key": "client-documents/test/test.pdf" }`

## Dependencies

**External Dependencies**:
- Supabase Storage: Document storage (configure bucket before implementing documents feature)
- Supabase PostgreSQL: Database (already configured)
- Better Auth: Authentication (already configured from user-authentication epic)

**Internal Dependencies**:
- User Authentication Epic: Must be complete - provides user context for RLS policies
- Users table: Foreign key references for ownership fields

**Data Dependencies**:
- Authenticated user session: Required for all API operations
- User ID from JWT: Used by RLS policies for data isolation

## Success Criteria (Technical)

**Performance Benchmarks**:
- Client list load: < 500ms for 100 clients
- Search response: < 300ms for results
- Document upload: Progress visible, complete < 30s for 10MB
- Profile load: < 2s including related counts

**Quality Gates**:
- [ ] Test coverage > 80% for services
- [ ] No critical security vulnerabilities (RLS policies tested)
- [ ] Mobile responsive (375px+ width tested)
- [ ] Lighthouse performance score > 90

**Acceptance Criteria**:
- [ ] Agents can create, view, update, and soft-delete clients
- [ ] Client search returns results within 500ms
- [ ] Documents upload with progress and respect 10MB limit
- [ ] Notes support importance flagging and filtering
- [ ] Tasks show visual indicators for overdue/today
- [ ] CSV import handles 500+ records with error reporting
- [ ] CSV export includes all client fields
- [ ] RLS policies prevent cross-agent data access

## Estimated Effort

- **Total Duration**: 3-4 weeks
- **Breakdown by Area**:
  - Database Schema & Migrations: 4 hours
  - Backend API Development: 16 hours
  - Frontend Components: 24 hours
  - Storage Integration: 4 hours
  - CSV Import/Export: 8 hours
  - Testing & QA: 12 hours
- **Critical Path**: Database schema → API endpoints → Frontend (sequential)

## Tasks Created

- [ ] 001.md - Database Schema & Migrations (parallel: false)
- [ ] 002.md - Supabase Storage Setup (parallel: false, depends_on: 001)
- [ ] 003.md - Client CRUD API (parallel: true, depends_on: 001)
- [ ] 004.md - Tags, Notes, Tasks API (parallel: true, depends_on: 001)
- [ ] 005.md - Document Management API (parallel: true, depends_on: 001, 002)
- [ ] 006.md - Client List & Profile UI (parallel: false, depends_on: 003, 004, 005)
- [ ] 007.md - CSV Import/Export (parallel: true, depends_on: 003)

**Total tasks**: 7
**Parallel tasks**: 4 (003, 004, 005, 007 can run concurrently after dependencies)
**Sequential tasks**: 3 (001, 002, 006 must run in sequence)
**Estimated total effort**: 46 hours
