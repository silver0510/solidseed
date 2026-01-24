/**
 * Type definitions for deal management system
 */

// Deal status enum
export type DealStatus = 'active' | 'pending' | 'closed_won' | 'closed_lost' | 'cancelled';

// Milestone status enum
export type MilestoneStatus = 'pending' | 'completed' | 'cancelled';

// Document type enum
export type DocumentType = 'contract' | 'disclosure' | 'inspection_report' | 'appraisal' | 'closing_statement' | 'other';

// Activity type enum
export type ActivityType =
  | 'stage_change'
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'showing'
  | 'document_upload'
  | 'document_delete'
  | 'milestone_complete'
  | 'field_update'
  | 'other';

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
  created_at: string;
  updated_at: string;
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

// API request/response types

// Create deal request
export interface CreateDealInput {
  deal_type_id: string;
  client_id: string;
  deal_name?: string;
  secondary_client_ids?: string[];
  deal_value?: number;
  commission_rate?: number;
  commission_split_percent?: number;
  expected_close_date?: string;
  deal_data: ResidentialSaleData | MortgageData | Record<string, unknown>;
  notes?: string;
  referral_source?: string;
}

// Update deal request
export interface UpdateDealInput {
  deal_name?: string;
  deal_value?: number;
  commission_rate?: number;
  commission_split_percent?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  deal_data?: ResidentialSaleData | MortgageData | Record<string, unknown>;
  notes?: string;
  referral_source?: string;
}

// Change stage request
export interface ChangeDealStageInput {
  new_stage: string;
  lost_reason?: string;
}

// Create activity request
export interface CreateActivityInput {
  activity_type: ActivityType;
  title: string;
  description?: string;
}

// Pipeline response
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

export interface PipelineResponse {
  stages: PipelineStageData[];
  summary: PipelineSummary;
}

// Query parameters
export interface GetPipelineParams {
  deal_type_id?: string;
  assigned_to?: string;
  limit?: number;
}

// Commission calculation result
export interface CommissionCalculation {
  commission_amount: number;
  agent_commission: number;
}
