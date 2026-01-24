---
name: deal-management
status: backlog
created: 2026-01-24T14:02:40Z
progress: 0%
prd: .claude/prds/deal-management.md
github: [Will be updated when synced to GitHub]
---

# Epic: deal-management

## Overview

Implement a multi-type deal pipeline system for tracking real estate and mortgage transactions from lead to close. The system provides a Kanban-style pipeline board with drag-and-drop stage management, type-specific fields stored in JSONB, automated milestone creation, document management, activity logging, and commission calculations. Built mobile-first using React DnD for desktop and swipe gestures for mobile.

## Architecture Decisions

### 1. JSONB for Type-Specific Fields

**Decision**: Store deal type configurations (pipeline_stages, enabled_fields, default_milestones) and deal-specific data in JSONB columns rather than creating separate tables for each deal type.

**Rationale**:
- Enables future extensibility without schema migrations
- Single `deals` table serves all deal types with unified querying
- Type configuration centralized in `deal_types` table as JSON templates
- PostgreSQL GIN index on `deal_data` JSONB enables efficient queries

**Trade-offs**:
- No foreign key constraints on JSONB fields (enforced in application layer)
- Slightly more complex validation logic
- Mitigation: TypeScript interfaces enforce structure at compile time

### 2. Unified Deal Table with Type Reference

**Decision**: Single `deals` table with `deal_type_id` foreign key rather than inheritance or separate tables per type.

**Rationale**:
- Simplified queries across all deal types
- Easier reporting and aggregation
- Common fields (value, stage, dates) shared across types
- Type-specific fields in `deal_data` JSONB column

**Trade-offs**:
- Cannot enforce type-specific required fields at database level
- Mitigation: Application-level validation based on `enabled_fields` configuration

### 3. Activity-Based Stage Tracking

**Decision**: Track all stage changes in `deal_activities` table rather than storing stage history in deals table.

**Rationale**:
- Complete audit trail of all deal movements
- Enables velocity reporting (time per stage calculations)
- Immutable activity records for compliance
- Single source of truth for deal history

**Trade-offs**:
- Requires JOIN for stage history queries
- Mitigation: Denormalized `current_stage` in deals table for fast reads

### 4. Supabase Storage for Documents

**Decision**: Use Supabase Storage with signed URLs for deal document management rather than external storage.

**Rationale**:
- Integrated with existing Supabase infrastructure
- RLS policies apply to storage buckets
- Signed URLs provide secure, time-limited access
- No additional storage service to manage

**Trade-offs**:
- 25MB file limit per document
- Mitigation: Acceptable for typical real estate documents (contracts, disclosures)

### 5. Optimistic UI with React Query

**Decision**: Implement optimistic updates for stage changes and field edits using React Query mutations.

**Rationale**:
- Instant feedback for drag-and-drop operations
- Better mobile experience with swipe gestures
- Automatic rollback on failure
- Cached data synchronization

**Trade-offs**:
- More complex state management
- Mitigation: React Query handles rollback automatically

## Implementation Guide

### Database Schema

**Reference**: See `.claude/database/database.dbml` for existing schema and conventions.

**Existing Tables Used**:
- `users` - Creator and assigned_to relationships
- `clients` - Deal-client linking (foreign key dependency)

**New Tables**:

```sql
-- =============================================================================
-- DEAL TYPE CONFIGURATION TABLE
-- =============================================================================
-- Stores deal type templates with pipeline stages, enabled fields, and milestones
CREATE TABLE deal_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type identification
  type_code VARCHAR(50) NOT NULL UNIQUE,
  type_name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),

  -- Configuration (JSONB for flexibility)
  pipeline_stages JSONB NOT NULL DEFAULT '[]',
  enabled_fields JSONB NOT NULL DEFAULT '{}',
  default_milestones JSONB DEFAULT '[]',

  -- System flags
  is_system BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_deal_types_type_code ON deal_types(type_code);
CREATE INDEX idx_deal_types_is_active ON deal_types(is_active);

-- =============================================================================
-- DEALS TABLE
-- =============================================================================
-- Core deal/transaction records
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Deal identification
  deal_name VARCHAR(255) NOT NULL,
  deal_type_id UUID NOT NULL REFERENCES deal_types(id),

  -- Client relationship
  client_id UUID NOT NULL REFERENCES clients(id),
  secondary_client_ids UUID[] DEFAULT '{}',

  -- Pipeline status
  current_stage VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',

  -- Financial
  deal_value DECIMAL(12,2),
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(12,2),
  commission_split_percent DECIMAL(5,2),
  agent_commission DECIMAL(12,2),

  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  days_in_pipeline INTEGER,
  closed_at TIMESTAMPTZ,

  -- Type-specific data (JSONB)
  deal_data JSONB NOT NULL DEFAULT '{}',

  -- Additional info
  notes TEXT,
  lost_reason TEXT,
  referral_source VARCHAR(255),

  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID NOT NULL REFERENCES users(id),

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT chk_deals_status CHECK (status IN ('active', 'pending', 'closed_won', 'closed_lost', 'cancelled')),
  CONSTRAINT chk_deals_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100),
  CONSTRAINT chk_deals_commission_split CHECK (commission_split_percent >= 0 AND commission_split_percent <= 100),
  CONSTRAINT chk_deals_value_positive CHECK (deal_value >= 0),
  CONSTRAINT chk_deals_actual_close CHECK (actual_close_date IS NULL OR actual_close_date <= CURRENT_DATE)
);

-- Indexes
CREATE INDEX idx_deals_client_id ON deals(client_id);
CREATE INDEX idx_deals_deal_type_id ON deals(deal_type_id);
CREATE INDEX idx_deals_assigned_status ON deals(assigned_to, status);
CREATE INDEX idx_deals_current_stage ON deals(current_stage);
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date);
CREATE INDEX idx_deals_is_deleted ON deals(is_deleted);
CREATE INDEX idx_deals_created_at ON deals(created_at);
CREATE INDEX idx_deals_deal_data ON deals USING GIN (deal_data);

-- =============================================================================
-- DEAL MILESTONES TABLE
-- =============================================================================
-- Track key dates and events in deal lifecycle
CREATE TABLE deal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent deal
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Milestone details
  milestone_type VARCHAR(50) NOT NULL,
  milestone_name VARCHAR(255) NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,

  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT chk_milestones_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_deal_milestones_deal_scheduled ON deal_milestones(deal_id, scheduled_date);
CREATE INDEX idx_deal_milestones_status_date ON deal_milestones(scheduled_date, status);

-- =============================================================================
-- DEAL DOCUMENTS TABLE
-- =============================================================================
-- Document storage metadata for deal files
CREATE TABLE deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent deal
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Document metadata
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  description TEXT,

  -- Audit
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT chk_documents_type CHECK (document_type IN ('contract', 'disclosure', 'inspection_report', 'appraisal', 'closing_statement', 'other')),
  CONSTRAINT chk_documents_size CHECK (file_size > 0 AND file_size <= 26214400)
);

-- Indexes
CREATE INDEX idx_deal_documents_deal_type ON deal_documents(deal_id, document_type);
CREATE INDEX idx_deal_documents_uploaded_at ON deal_documents(uploaded_at);

-- =============================================================================
-- DEAL ACTIVITIES TABLE
-- =============================================================================
-- Audit log of all deal changes and interactions
CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent deal
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Activity details
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Stage change specific
  old_stage VARCHAR(50),
  new_stage VARCHAR(50),

  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT chk_activities_type CHECK (activity_type IN ('stage_change', 'note', 'call', 'email', 'meeting', 'showing', 'document_upload', 'document_delete', 'milestone_complete', 'field_update', 'other'))
);

-- Indexes
CREATE INDEX idx_deal_activities_deal_created ON deal_activities(deal_id, created_at DESC);
CREATE INDEX idx_deal_activities_type ON deal_activities(activity_type);

-- =============================================================================
-- SEED DATA: DEAL TYPES
-- =============================================================================

-- Residential Sale Deal Type
INSERT INTO deal_types (type_code, type_name, icon, color, pipeline_stages, enabled_fields, default_milestones, is_system)
VALUES (
  'residential_sale',
  'Residential Sale',
  'home',
  '#3B82F6',
  '[
    {"code": "lead", "name": "Lead", "order": 1},
    {"code": "qualifying", "name": "Qualifying", "order": 2},
    {"code": "showing", "name": "Showing", "order": 3},
    {"code": "offer", "name": "Offer", "order": 4},
    {"code": "contract", "name": "Under Contract", "order": 5},
    {"code": "closing", "name": "Closing", "order": 6},
    {"code": "closed", "name": "Closed", "order": 7},
    {"code": "lost", "name": "Lost", "order": 8}
  ]'::jsonb,
  '{
    "required": ["property_address", "deal_side", "listing_price"],
    "optional": ["property_type", "bedrooms", "bathrooms", "square_feet", "mls_number", "sale_price", "financing_type", "lender_name", "year_built", "lot_size"],
    "enums": {
      "deal_side": ["buyer_side", "seller_side", "dual_agency"],
      "property_type": ["single_family", "condo", "townhouse", "multi_family", "land"],
      "financing_type": ["conventional", "fha", "va", "cash", "other"]
    }
  }'::jsonb,
  '[
    {"type": "inspection", "name": "Inspection", "days_offset": 10},
    {"type": "appraisal", "name": "Appraisal", "days_offset": 14},
    {"type": "financing_approval", "name": "Financing Approval", "days_offset": 21},
    {"type": "final_walkthrough", "name": "Final Walkthrough", "days_offset": 28},
    {"type": "closing", "name": "Closing", "days_offset": 30}
  ]'::jsonb,
  true
);

-- Mortgage Loan Deal Type
INSERT INTO deal_types (type_code, type_name, icon, color, pipeline_stages, enabled_fields, default_milestones, is_system)
VALUES (
  'mortgage',
  'Mortgage Loan',
  'calculator',
  '#10B981',
  '[
    {"code": "lead", "name": "Lead", "order": 1},
    {"code": "prequalification", "name": "Prequalification", "order": 2},
    {"code": "application", "name": "Application", "order": 3},
    {"code": "processing", "name": "Processing", "order": 4},
    {"code": "underwriting", "name": "Underwriting", "order": 5},
    {"code": "approval", "name": "Approval", "order": 6},
    {"code": "closing", "name": "Closing", "order": 7},
    {"code": "funded", "name": "Funded", "order": 8}
  ]'::jsonb,
  '{
    "required": ["loan_amount", "loan_type", "loan_purpose", "property_address"],
    "optional": ["purchase_price", "down_payment", "down_payment_percent", "interest_rate", "loan_term_years", "credit_score", "debt_to_income_ratio", "employment_type", "lender_name", "loan_officer", "estimated_closing_costs"],
    "enums": {
      "loan_type": ["conventional", "fha", "va", "usda", "jumbo", "heloc", "other"],
      "loan_purpose": ["purchase", "refinance", "cash_out_refinance", "construction"],
      "loan_term_years": [15, 20, 25, 30],
      "employment_type": ["w2", "self_employed", "retired", "other"]
    }
  }'::jsonb,
  '[
    {"type": "credit_pull", "name": "Credit Pull", "days_offset": 1},
    {"type": "appraisal_ordered", "name": "Appraisal Ordered", "days_offset": 5},
    {"type": "appraisal_complete", "name": "Appraisal Complete", "days_offset": 12},
    {"type": "underwriting_complete", "name": "Underwriting Complete", "days_offset": 21},
    {"type": "clear_to_close", "name": "Clear to Close", "days_offset": 28},
    {"type": "closing_scheduled", "name": "Closing Scheduled", "days_offset": 35}
  ]'::jsonb,
  true
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all deal tables
ALTER TABLE deal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

-- Deal types: All authenticated users can read active types
CREATE POLICY "deal_types_read" ON deal_types
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Deals: Users can only access their assigned deals
CREATE POLICY "deals_select" ON deals
  FOR SELECT USING (assigned_to = auth.uid() AND is_deleted = false);

CREATE POLICY "deals_insert" ON deals
  FOR INSERT WITH CHECK (assigned_to = auth.uid() AND created_by = auth.uid());

CREATE POLICY "deals_update" ON deals
  FOR UPDATE USING (assigned_to = auth.uid() AND is_deleted = false);

CREATE POLICY "deals_delete" ON deals
  FOR DELETE USING (assigned_to = auth.uid());

-- Deal milestones: Access through deal ownership
CREATE POLICY "deal_milestones_select" ON deal_milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_milestones.deal_id AND deals.assigned_to = auth.uid() AND deals.is_deleted = false)
  );

CREATE POLICY "deal_milestones_insert" ON deal_milestones
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_milestones.deal_id AND deals.assigned_to = auth.uid() AND deals.is_deleted = false)
    AND created_by = auth.uid()
  );

CREATE POLICY "deal_milestones_update" ON deal_milestones
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_milestones.deal_id AND deals.assigned_to = auth.uid() AND deals.is_deleted = false)
  );

CREATE POLICY "deal_milestones_delete" ON deal_milestones
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_milestones.deal_id AND deals.assigned_to = auth.uid())
  );

-- Deal documents: Access through deal ownership
CREATE POLICY "deal_documents_select" ON deal_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_documents.deal_id AND deals.assigned_to = auth.uid() AND deals.is_deleted = false)
  );

CREATE POLICY "deal_documents_insert" ON deal_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_documents.deal_id AND deals.assigned_to = auth.uid() AND deals.is_deleted = false)
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "deal_documents_delete" ON deal_documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_documents.deal_id AND deals.assigned_to = auth.uid())
  );

-- Deal activities: Access through deal ownership
CREATE POLICY "deal_activities_select" ON deal_activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_activities.deal_id AND deals.assigned_to = auth.uid() AND deals.is_deleted = false)
  );

CREATE POLICY "deal_activities_insert" ON deal_activities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_activities.deal_id AND deals.assigned_to = auth.uid() AND deals.is_deleted = false)
    AND created_by = auth.uid()
  );
```

**DBML Addition** (to be added to database.dbml):

```dbml
// =============================================================================
// DEAL MANAGEMENT TABLES
// =============================================================================

// Deal type configuration templates
Table deal_types {
  id uuid [pk, default: `gen_random_uuid()`, note: 'UUID primary key']

  type_code varchar(50) [not null, unique, note: 'Unique identifier (kebab-case)']
  type_name varchar(100) [not null, note: 'Display name']
  icon varchar(50) [note: 'Icon identifier for UI']
  color varchar(7) [note: 'Hex color code (#RRGGBB)']

  pipeline_stages jsonb [not null, default: '[]', note: 'Array of stage objects with code, name, order']
  enabled_fields jsonb [not null, default: '{}', note: 'Field configuration: required, optional, enums']
  default_milestones jsonb [default: '[]', note: 'Milestone templates with type, name, days_offset']

  is_system boolean [not null, default: true, note: 'System-managed type (cannot be deleted)']
  is_active boolean [not null, default: true, note: 'Active status']

  created_by uuid [ref: > users.id, note: 'Creator user ID']
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    type_code [unique, name: 'idx_deal_types_type_code']
    is_active [name: 'idx_deal_types_is_active']
  }

  note: 'Deal type configuration templates with pipeline stages and field definitions'
}

// Core deal/transaction records
Table deals {
  id uuid [pk, default: `gen_random_uuid()`, note: 'UUID primary key']

  deal_name varchar(255) [not null, note: 'Deal display name']
  deal_type_id uuid [not null, ref: > deal_types.id, note: 'Reference to deal type']

  client_id uuid [not null, ref: > clients.id, note: 'Primary client']
  secondary_client_ids uuid[] [default: '{}', note: 'Additional clients (co-buyers)']

  current_stage varchar(50) [not null, note: 'Current pipeline stage code']
  status varchar(50) [not null, default: 'active', note: 'active, pending, closed_won, closed_lost, cancelled']

  deal_value decimal(12,2) [note: 'Transaction amount']
  commission_rate decimal(5,2) [note: 'Commission percentage (0-100)']
  commission_amount decimal(12,2) [note: 'Calculated: deal_value * rate']
  commission_split_percent decimal(5,2) [note: 'Agent split percentage (0-100)']
  agent_commission decimal(12,2) [note: 'Calculated: commission * split']

  expected_close_date date [note: 'Expected closing date']
  actual_close_date date [note: 'Actual closing date (<= today)']
  days_in_pipeline integer [note: 'Days from creation (auto-calculated)']
  closed_at timestamptz [note: 'Close timestamp']

  deal_data jsonb [not null, default: '{}', note: 'Type-specific fields']

  notes text [note: 'General notes']
  lost_reason text [note: 'Required if status=closed_lost']
  referral_source varchar(255) [note: 'How deal was sourced']

  created_by uuid [not null, ref: > users.id, note: 'Creator user ID']
  assigned_to uuid [not null, ref: > users.id, note: 'Owner user ID']

  is_deleted boolean [not null, default: false, note: 'Soft delete flag']

  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    client_id [name: 'idx_deals_client_id']
    deal_type_id [name: 'idx_deals_deal_type_id']
    (assigned_to, status) [name: 'idx_deals_assigned_status']
    current_stage [name: 'idx_deals_current_stage']
    expected_close_date [name: 'idx_deals_expected_close']
    is_deleted [name: 'idx_deals_is_deleted']
    created_at [name: 'idx_deals_created_at']
  }

  note: 'Core deal/transaction records for real estate and mortgage tracking'
}

// Deal milestones for tracking key dates
Table deal_milestones {
  id uuid [pk, default: `gen_random_uuid()`, note: 'UUID primary key']

  deal_id uuid [not null, ref: > deals.id, note: 'Parent deal (CASCADE delete)']

  milestone_type varchar(50) [not null, note: 'Milestone category']
  milestone_name varchar(255) [not null, note: 'Display name']
  scheduled_date date [note: 'Target date']
  completed_date date [note: 'Actual completion date']
  status varchar(20) [not null, default: 'pending', note: 'pending, completed, cancelled']
  notes text [note: 'Additional notes']

  created_by uuid [not null, ref: > users.id, note: 'Creator user ID']
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (deal_id, scheduled_date) [name: 'idx_deal_milestones_deal_scheduled']
    (scheduled_date, status) [name: 'idx_deal_milestones_status_date']
  }

  note: 'Deal milestones for tracking key dates and events'
}

// Deal document metadata
Table deal_documents {
  id uuid [pk, default: `gen_random_uuid()`, note: 'UUID primary key']

  deal_id uuid [not null, ref: > deals.id, note: 'Parent deal (CASCADE delete)']

  document_type varchar(50) [not null, note: 'contract, disclosure, inspection_report, appraisal, closing_statement, other']
  file_name varchar(255) [not null, note: 'Original filename']
  file_path text [not null, unique, note: 'Supabase storage path']
  file_size integer [not null, note: 'Size in bytes (max 25MB)']
  file_type varchar(50) [not null, note: 'MIME type']
  description text [note: 'User description']

  uploaded_by uuid [not null, ref: > users.id, note: 'Uploader user ID']
  uploaded_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (deal_id, document_type) [name: 'idx_deal_documents_deal_type']
    uploaded_at [name: 'idx_deal_documents_uploaded_at']
  }

  note: 'Deal document metadata for uploaded files'
}

// Deal activity audit log
Table deal_activities {
  id uuid [pk, default: `gen_random_uuid()`, note: 'UUID primary key']

  deal_id uuid [not null, ref: > deals.id, note: 'Parent deal (CASCADE delete)']

  activity_type varchar(50) [not null, note: 'stage_change, note, call, email, meeting, showing, document_upload, etc.']
  title varchar(255) [not null, note: 'Activity summary']
  description text [note: 'Detailed description (max 2000 chars)']

  old_stage varchar(50) [note: 'Previous stage (for stage_change)']
  new_stage varchar(50) [note: 'New stage (for stage_change)']

  created_by uuid [not null, ref: > users.id, note: 'User who created activity']
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (deal_id, created_at) [name: 'idx_deal_activities_deal_created']
    activity_type [name: 'idx_deal_activities_type']
  }

  note: 'Immutable audit log of all deal changes and interactions'
}

TableGroup deal_management {
  deal_types
  deals
  deal_milestones
  deal_documents
  deal_activities
}
```

### API Endpoints

**POST /api/deals**
- **Purpose**: Create a new deal
- **Request Body**:
  ```json
  {
    "deal_type_id": "uuid",
    "client_id": "uuid",
    "deal_name": "string (optional, auto-generated if empty)",
    "deal_value": 450000,
    "commission_rate": 3.0,
    "commission_split_percent": 80,
    "expected_close_date": "2026-03-15",
    "deal_data": {
      "property_address": "123 Main St, City, ST 12345",
      "deal_side": "buyer_side",
      "listing_price": 465000,
      "property_type": "single_family"
    }
  }
  ```
- **Validation**:
  - `deal_type_id` must reference active deal type
  - `client_id` must reference existing non-deleted client
  - Required fields from `enabled_fields.required` must be present in `deal_data`
  - Commission rate 0-100, values >= 0
- **Response Success (201)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "deal_name": "123 Main St - John Doe",
      "current_stage": "lead",
      "status": "active",
      "commission_amount": 13500,
      "agent_commission": 10800
    }
  }
  ```
- **Response Error (400)**:
  ```json
  {
    "error": "Missing required field: property_address"
  }
  ```

**PATCH /api/deals/:id/stage**
- **Purpose**: Change deal stage (triggers milestone auto-creation)
- **Request Body**:
  ```json
  {
    "new_stage": "contract",
    "lost_reason": "string (required if new_stage is 'lost')"
  }
  ```
- **Validation**:
  - `new_stage` must exist in deal type's `pipeline_stages`
  - Moving to 'closed' requires `actual_close_date`
  - Moving to 'lost' requires `lost_reason` (min 10 chars)
- **Side Effects**:
  - Creates activity log entry
  - Auto-creates milestones when moving to trigger stages (contract/application)
  - Updates `status` if moving to terminal stages
  - Sets `closed_at` timestamp for closed/lost stages
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "current_stage": "contract",
      "status": "active",
      "milestones_created": 5
    }
  }
  ```

**GET /api/deals/pipeline**
- **Purpose**: Get deals for pipeline board grouped by stage
- **Query Parameters**:
  - `deal_type_id`: Filter by deal type (optional)
  - `assigned_to`: Filter by user (defaults to current user)
  - `limit`: Deals per stage (default 20)
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "stages": [
        {
          "code": "lead",
          "name": "Lead",
          "deals": [...],
          "count": 5,
          "total_value": 1250000
        }
      ],
      "summary": {
        "total_pipeline_value": 4500000,
        "expected_commission": 135000,
        "active_deals": 23
      }
    }
  }
  ```

**POST /api/deals/:id/documents**
- **Purpose**: Upload document to deal
- **Request**: Multipart form data with file
- **Validation**:
  - File size <= 25MB
  - Allowed types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
- **Response Success (201)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "file_name": "contract.pdf",
      "file_path": "deals/uuid/documents/uuid_contract.pdf",
      "download_url": "https://..."
    }
  }
  ```

**POST /api/deals/:id/activities**
- **Purpose**: Add manual activity (note, call, meeting, etc.)
- **Request Body**:
  ```json
  {
    "activity_type": "call",
    "title": "Called client about closing date",
    "description": "Discussed moving closing to March 20th..."
  }
  ```
- **Response Success (201)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "activity_type": "call",
      "title": "Called client about closing date",
      "created_at": "2026-01-24T14:00:00Z"
    }
  }
  ```

### TypeScript Types

```typescript
// types/deals.ts

export type DealStatus = 'active' | 'pending' | 'closed_won' | 'closed_lost' | 'cancelled';
export type MilestoneStatus = 'pending' | 'completed' | 'cancelled';
export type DocumentType = 'contract' | 'disclosure' | 'inspection_report' | 'appraisal' | 'closing_statement' | 'other';
export type ActivityType = 'stage_change' | 'note' | 'call' | 'email' | 'meeting' | 'showing' | 'document_upload' | 'document_delete' | 'milestone_complete' | 'field_update' | 'other';

// Pipeline stage configuration
export interface PipelineStage {
  code: string;
  name: string;
  order: number;
}

// Milestone template from deal type
export interface MilestoneTemplate {
  type: string;
  name: string;
  days_offset: number;
}

// Deal type configuration
export interface DealType {
  id: string;
  type_code: string;
  type_name: string;
  icon: string | null;
  color: string | null;
  pipeline_stages: PipelineStage[];
  enabled_fields: {
    required: string[];
    optional: string[];
    enums: Record<string, string[] | number[]>;
  };
  default_milestones: MilestoneTemplate[];
  is_system: boolean;
  is_active: boolean;
}

// Residential sale specific data
export interface ResidentialSaleData {
  property_address: string;
  deal_side: 'buyer_side' | 'seller_side' | 'dual_agency';
  listing_price: number;
  property_type?: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land';
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  mls_number?: string;
  sale_price?: number;
  financing_type?: 'conventional' | 'fha' | 'va' | 'cash' | 'other';
  lender_name?: string;
  year_built?: number;
  lot_size?: string;
}

// Mortgage loan specific data
export interface MortgageData {
  loan_amount: number;
  loan_type: 'conventional' | 'fha' | 'va' | 'usda' | 'jumbo' | 'heloc' | 'other';
  loan_purpose: 'purchase' | 'refinance' | 'cash_out_refinance' | 'construction';
  property_address: string;
  purchase_price?: number;
  down_payment?: number;
  down_payment_percent?: number;
  interest_rate?: number;
  loan_term_years?: 15 | 20 | 25 | 30;
  credit_score?: number;
  debt_to_income_ratio?: number;
  employment_type?: 'w2' | 'self_employed' | 'retired' | 'other';
  lender_name?: string;
  loan_officer?: string;
  estimated_closing_costs?: number;
}

// Core deal type
export interface Deal {
  id: string;
  deal_name: string;
  deal_type_id: string;
  deal_type?: DealType;
  client_id: string;
  client?: { id: string; name: string; email: string };
  secondary_client_ids: string[];
  current_stage: string;
  status: DealStatus;
  deal_value: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  commission_split_percent: number | null;
  agent_commission: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  days_in_pipeline: number | null;
  closed_at: string | null;
  deal_data: ResidentialSaleData | MortgageData | Record<string, unknown>;
  notes: string | null;
  lost_reason: string | null;
  referral_source: string | null;
  created_by: string;
  assigned_to: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Milestone type
export interface DealMilestone {
  id: string;
  deal_id: string;
  milestone_type: string;
  milestone_name: string;
  scheduled_date: string | null;
  completed_date: string | null;
  status: MilestoneStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Document type
export interface DealDocument {
  id: string;
  deal_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description: string | null;
  uploaded_by: string;
  uploaded_at: string;
  download_url?: string;
}

// Activity type
export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  old_stage: string | null;
  new_stage: string | null;
  created_by: string;
  created_at: string;
}

// Pipeline board data structure
export interface PipelineStageData {
  code: string;
  name: string;
  deals: Deal[];
  count: number;
  total_value: number;
}

export interface PipelineSummary {
  total_pipeline_value: number;
  expected_commission: number;
  active_deals: number;
}
```

### Frontend Components

**Component: DealPipelineBoard**

Purpose: Main Kanban board showing deals organized by stage with drag-and-drop

Key implementation:
- Props: `{ dealTypeId?: string, userId?: string }`
- State: React Query for deals, local drag state for optimistic updates
- Handlers: `onDragEnd` for stage changes, `onDealClick` for navigation
- Use `@dnd-kit/core` for drag-and-drop
- Mobile: Accordion view with expandable stages, swipe gestures
- Styling: Tailwind with responsive breakpoints (md:768px)

**Component: DealCard**

Purpose: Individual deal card displayed on pipeline board

Key implementation:
- Props: `{ deal: Deal, isDragging: boolean }`
- Display: Deal name, client name, value (formatted currency), days in stage, stage badge
- Color: Border/accent color from deal type configuration
- Mobile: Condensed view with essential info only

**Component: DealDetailPage**

Purpose: Full deal view with tabs for Overview, Details, Milestones, Documents, Activity

Key implementation:
- Props: Route param `dealId`
- Tabs: Use headless UI tabs or shadcn/ui
- Overview: Stage progress bar, financial summary card, key dates, quick actions
- Details: Dynamic form based on `enabled_fields` from deal type
- Mobile: 375px+ responsive, tabs as horizontal scroll

**Component: DealForm**

Purpose: Create/edit deal form with dynamic fields

Key implementation:
- Props: `{ deal?: Deal, dealTypeId?: string, clientId?: string, onSuccess: (deal) => void }`
- Dynamic rendering: Generate fields from `deal_type.enabled_fields`
- Validation: Required fields, enum constraints, commission rate bounds
- Auto-save: Debounced field updates on blur

**Component: MilestoneTimeline**

Purpose: Visual timeline of deal milestones

Key implementation:
- Props: `{ milestones: DealMilestone[], onComplete: (id) => void }`
- Display: Vertical timeline with date markers, status icons
- Highlight: Overdue (red), upcoming 7 days (amber), future (gray)
- Completion: Checkbox toggle with optimistic update

**Component: DocumentUploader**

Purpose: File upload component for deal documents

Key implementation:
- Props: `{ dealId: string, onUpload: (doc) => void }`
- Features: Drag-drop zone, multi-file selection, progress bar
- Validation: File size (25MB), allowed types
- Type selector: Document type dropdown before upload

### Service Integration

**Supabase Client for Deals**

```typescript
// lib/deals.ts
import { createClient } from '@supabase/supabase-js';
import type { Deal, DealMilestone, DealActivity, DealDocument, DealType } from '@/types/deals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get deal types
export async function getDealTypes(): Promise<DealType[]> {
  const { data, error } = await supabase
    .from('deal_types')
    .select('*')
    .eq('is_active', true)
    .order('type_name');

  if (error) throw error;
  return data;
}

// Get pipeline deals grouped by stage
export async function getPipelineDeals(dealTypeId?: string, userId?: string) {
  let query = supabase
    .from('deals')
    .select(`
      *,
      deal_type:deal_types(*),
      client:clients(id, name, email)
    `)
    .eq('is_deleted', false)
    .eq('status', 'active');

  if (dealTypeId) query = query.eq('deal_type_id', dealTypeId);
  if (userId) query = query.eq('assigned_to', userId);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as Deal[];
}

// Create deal with validation
export async function createDeal(deal: Partial<Deal>): Promise<Deal> {
  // Auto-generate deal name if not provided
  if (!deal.deal_name) {
    const address = (deal.deal_data as any)?.property_address ||
                   `$${(deal.deal_data as any)?.loan_amount?.toLocaleString() || 'New Deal'}`;
    deal.deal_name = address;
  }

  // Calculate commission amounts
  if (deal.deal_value && deal.commission_rate) {
    deal.commission_amount = deal.deal_value * (deal.commission_rate / 100);
    if (deal.commission_split_percent) {
      deal.agent_commission = deal.commission_amount * (deal.commission_split_percent / 100);
    }
  }

  const { data, error } = await supabase
    .from('deals')
    .insert(deal)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await logActivity(data.id, 'other', 'Deal Created', `Created deal: ${data.deal_name}`);

  return data;
}

// Change deal stage with milestone auto-creation
export async function changeDealStage(
  dealId: string,
  newStage: string,
  lostReason?: string
): Promise<{ deal: Deal; milestonesCreated: number }> {
  // Get current deal with type
  const { data: deal } = await supabase
    .from('deals')
    .select('*, deal_type:deal_types(*)')
    .eq('id', dealId)
    .single();

  if (!deal) throw new Error('Deal not found');

  const oldStage = deal.current_stage;
  const updates: Partial<Deal> = {
    current_stage: newStage,
    updated_at: new Date().toISOString(),
  };

  // Handle terminal stages
  if (newStage === 'closed' || newStage === 'funded') {
    updates.status = 'closed_won';
    updates.closed_at = new Date().toISOString();
  } else if (newStage === 'lost') {
    if (!lostReason || lostReason.length < 10) {
      throw new Error('Lost reason required (min 10 characters)');
    }
    updates.status = 'closed_lost';
    updates.closed_at = new Date().toISOString();
    updates.lost_reason = lostReason;
  }

  // Update deal
  const { data: updatedDeal, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', dealId)
    .select()
    .single();

  if (error) throw error;

  // Log stage change activity
  await logActivity(dealId, 'stage_change', `Moved to ${newStage}`, null, oldStage, newStage);

  // Auto-create milestones for trigger stages
  let milestonesCreated = 0;
  const triggerStages = {
    'residential_sale': 'contract',
    'mortgage': 'application',
  };

  const dealTypeCode = deal.deal_type?.type_code;
  if (dealTypeCode && triggerStages[dealTypeCode as keyof typeof triggerStages] === newStage) {
    milestonesCreated = await createDefaultMilestones(dealId, deal.deal_type);
  }

  return { deal: updatedDeal, milestonesCreated };
}

// Create default milestones from deal type template
async function createDefaultMilestones(dealId: string, dealType: DealType): Promise<number> {
  const milestones = dealType.default_milestones.map(template => ({
    deal_id: dealId,
    milestone_type: template.type,
    milestone_name: template.name,
    scheduled_date: calculateMilestoneDate(template.days_offset),
    status: 'pending' as const,
  }));

  const { data, error } = await supabase
    .from('deal_milestones')
    .insert(milestones)
    .select();

  if (error) throw error;

  // Log activity
  await logActivity(
    dealId,
    'other',
    `Created ${milestones.length} milestones`,
    `Milestones: ${milestones.map(m => m.milestone_name).join(', ')}`
  );

  return data.length;
}

function calculateMilestoneDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

// Log activity
async function logActivity(
  dealId: string,
  activityType: string,
  title: string,
  description?: string | null,
  oldStage?: string,
  newStage?: string
) {
  await supabase.from('deal_activities').insert({
    deal_id: dealId,
    activity_type: activityType,
    title,
    description,
    old_stage: oldStage,
    new_stage: newStage,
  });
}

// Upload document
export async function uploadDealDocument(
  dealId: string,
  file: File,
  documentType: string,
  description?: string
): Promise<DealDocument> {
  // Validate file
  const maxSize = 25 * 1024 * 1024; // 25MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  if (file.size > maxSize) throw new Error('File size exceeds 25MB limit');
  if (!allowedTypes.includes(file.type)) throw new Error('File type not allowed');

  // Upload to storage
  const fileId = crypto.randomUUID();
  const filePath = `deals/${dealId}/documents/${fileId}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('deal-documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Create document record
  const { data, error } = await supabase
    .from('deal_documents')
    .insert({
      deal_id: dealId,
      document_type: documentType,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      description,
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await logActivity(dealId, 'document_upload', `Uploaded: ${file.name}`);

  return data;
}
```

## Third-Party Setup

### Supabase Storage Configuration

**Prerequisites**:
- Existing Supabase project with authentication configured
- Supabase CLI installed and linked

**Step 1: Create Storage Bucket**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `deal-documents`
4. Public bucket: **No** (keep private)
5. File size limit: 25MB
6. Allowed MIME types: `application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Step 2: Configure RLS Policies**
```sql
-- Storage RLS for deal-documents bucket
CREATE POLICY "Users can upload to their deals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deal-documents' AND
  (storage.foldername(name))[1] = 'deals' AND
  EXISTS (
    SELECT 1 FROM deals
    WHERE id::text = (storage.foldername(name))[2]
    AND assigned_to = auth.uid()
    AND is_deleted = false
  )
);

CREATE POLICY "Users can view their deal documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1 FROM deals
    WHERE id::text = (storage.foldername(name))[2]
    AND assigned_to = auth.uid()
  )
);

CREATE POLICY "Users can delete their deal documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1 FROM deals
    WHERE id::text = (storage.foldername(name))[2]
    AND assigned_to = auth.uid()
  )
);
```

**Step 3: Test Upload**
```bash
# Test with Supabase JS client in browser console
const { data, error } = await supabase.storage
  .from('deal-documents')
  .upload('deals/test-deal-id/documents/test.pdf', testFile);
```

## Dependencies

**External Dependencies**:
- Supabase PostgreSQL: Database for all deal tables
- Supabase Storage: Document file storage (configured as above)
- @dnd-kit/core: Drag-and-drop for pipeline board
- recharts or chart.js: Pipeline analytics charts (dashboard phase)

**Internal Dependencies**:
- User Authentication (epic: user-authentication): Must be complete for user sessions and RLS
- Client Hub (existing): `clients` table must exist for deal-client linking

**Data Dependencies**:
- At least one user account for testing
- At least one client record for creating deals

## Success Criteria (Technical)

**Performance Benchmarks**:
- Pipeline board loads in < 2 seconds with 100 deals
- Stage change (drag-drop) completes in < 500ms
- Document upload shows progress, completes based on file size

**Quality Gates**:
- [ ] Test coverage > 70% for deal service functions
- [ ] No critical security vulnerabilities in RLS policies
- [ ] Mobile responsive (375px+ width) for all deal pages

**Acceptance Criteria**:
- [ ] Users can create residential sale and mortgage loan deals with type-specific fields
- [ ] Pipeline board displays deals by stage with drag-and-drop
- [ ] Stage changes log activities and trigger milestone auto-creation
- [ ] Commission amounts auto-calculate when deal value or rates change
- [ ] Documents upload to Supabase Storage with proper access control
- [ ] Deal detail page renders correctly on mobile (375px)
- [ ] Deals appear in client profile "Active Deals" widget

## Estimated Effort

- **Total Duration**: 3-4 weeks
- **Breakdown by Area**:
  - Database Schema & Migrations: 4 hours
  - API Endpoints (CRUD, stage, documents, activities): 12 hours
  - Pipeline Board Component (Kanban, drag-drop): 16 hours
  - Deal Detail Page (tabs, forms, milestones): 12 hours
  - Document Management (upload, display, delete): 8 hours
  - Mobile Responsiveness: 8 hours
  - Client Integration Widget: 4 hours
  - Testing & Bug Fixes: 8 hours
- **Critical Path**: Database → API Endpoints → Pipeline Board → Deal Detail

## Tasks Created

- [ ] 001.md - Database Schema and Migrations (parallel: true)
- [ ] 002.md - Deal Service and API Endpoints (parallel: false, depends: 001)
- [ ] 003.md - Supabase Storage Setup for Documents (parallel: true, depends: 001)
- [ ] 004.md - Pipeline Board with Drag-and-Drop (parallel: false, depends: 002)
- [ ] 005.md - Deal Detail Page with Tabs (parallel: false, depends: 002, 003)
- [ ] 006.md - Deal List View with Filtering (parallel: true, depends: 002)
- [ ] 007.md - Client Integration Widget (parallel: true, depends: 002)
- [ ] 008.md - Mobile Quick Add and Responsiveness (parallel: false, depends: 004, 005)

**Total tasks**: 8
**Parallel tasks**: 4 (001, 003, 006, 007)
**Sequential tasks**: 4 (002, 004, 005, 008)
**Estimated total effort**: 70 hours
