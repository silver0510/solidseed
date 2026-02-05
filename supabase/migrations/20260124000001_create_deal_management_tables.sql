-- =============================================================================
-- DEAL MANAGEMENT MIGRATION
-- =============================================================================
-- Creates tables for deal/transaction tracking in SolidSeed CRM
-- Tables: deal_types, deals, deal_milestones, deal_documents, deal_activities
-- Author: Task 001 - Database Schema and Migrations
-- Created: 2026-01-24
-- =============================================================================

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

-- Indexes for deal_types
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

-- Indexes for deals
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

-- Indexes for deal_milestones
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

-- Indexes for deal_documents
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

-- Indexes for deal_activities
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
      "financing_type": ["conventional", "fha", "va", "usda", "jumbo", "heloc", "other"]
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
