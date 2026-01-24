/**
 * Deal Management Types
 *
 * Type definitions for deals, deal types, milestones, and activities.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export interface DealType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  enabled_fields: DealTypeEnabledFields;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DealTypeEnabledFields {
  property_address?: DealFieldConfig;
  property_type?: DealFieldConfig;
  bedrooms?: DealFieldConfig;
  bathrooms?: DealFieldConfig;
  square_footage?: DealFieldConfig;
  lot_size?: DealFieldConfig;
  year_built?: DealFieldConfig;
  listing_price?: DealFieldConfig;
  loan_amount?: DealFieldConfig;
  down_payment?: DealFieldConfig;
  interest_rate?: DealFieldConfig;
  loan_type?: DealFieldConfig;
  lender_name?: DealFieldConfig;
  appraisal_value?: DealFieldConfig;
  inspection_date?: DealFieldConfig;
  contingencies?: DealFieldConfig;
  [key: string]: DealFieldConfig | undefined;
}

export interface DealFieldConfig {
  required: boolean;
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean' | 'textarea';
  enum_values?: string[];
  default_value?: any;
}

export interface Deal {
  id: string;
  user_id: string;
  deal_type_id: string;
  client_id: string;
  name: string;
  stage: DealStage;
  value: number;
  commission_rate: number;
  commission_amount: number;
  agent_commission: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  custom_fields: Record<string, any>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  deal_type?: DealType;
  client?: Client;
  milestones?: DealMilestone[];
  documents?: DealDocument[];
  activities?: DealActivity[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'contract_sent'
  | 'contract_signed'
  | 'pending'
  | 'closed_won'
  | 'closed_lost';

export interface DealMilestone {
  id: string;
  deal_id: string;
  name: string;
  due_date: string | null;
  completed_date: string | null;
  status: 'pending' | 'completed';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DealDocument {
  id: string;
  deal_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  uploaded_at: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: DealActivityType;
  description: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export type DealActivityType =
  | 'created'
  | 'stage_changed'
  | 'value_updated'
  | 'milestone_completed'
  | 'document_uploaded'
  | 'note_added'
  | 'field_updated';

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface CreateDealInput {
  deal_type_id: string;
  client_id: string;
  name: string;
  value: number;
  commission_rate: number;
  expected_close_date?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateDealInput {
  name?: string;
  stage?: DealStage;
  value?: number;
  commission_rate?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateDealStageInput {
  stage: DealStage;
  notes?: string;
}

export interface CreateMilestoneInput {
  name: string;
  due_date?: string;
}

export interface UpdateMilestoneInput {
  name?: string;
  due_date?: string;
  status?: 'pending' | 'completed';
}

export interface UploadDocumentInput {
  file: File;
  document_type: string;
}

export interface LogActivityInput {
  activity_type: DealActivityType;
  description: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// UI TYPES
// =============================================================================

export interface DealWithRelations extends Deal {
  deal_type: DealType;
  client: Client;
  milestones: DealMilestone[];
  documents: DealDocument[];
  activities: DealActivity[];
}

export interface DealFormData {
  deal_type_id: string;
  client_id: string;
  name: string;
  value: number;
  commission_rate: number;
  expected_close_date?: string;
  [key: string]: any; // For custom fields
}

export interface DealStageInfo {
  code: DealStage;
  name: string;
  color: string;
  description: string;
}

export const DEAL_STAGES: Record<DealStage, DealStageInfo> = {
  lead: {
    code: 'lead',
    name: 'Lead',
    color: '#94a3b8',
    description: 'Initial contact, potential opportunity',
  },
  qualified: {
    code: 'qualified',
    name: 'Qualified',
    color: '#3b82f6',
    description: 'Lead qualified, ready to move forward',
  },
  contract_sent: {
    code: 'contract_sent',
    name: 'Contract Sent',
    color: '#f59e0b',
    description: 'Contract sent, awaiting signature',
  },
  contract_signed: {
    code: 'contract_signed',
    name: 'Contract Signed',
    color: '#8b5cf6',
    description: 'Contract signed, moving to closing',
  },
  pending: {
    code: 'pending',
    name: 'Pending',
    color: '#ec4899',
    description: 'In escrow, pending close',
  },
  closed_won: {
    code: 'closed_won',
    name: 'Closed Won',
    color: '#10b981',
    description: 'Deal successfully closed',
  },
  closed_lost: {
    code: 'closed_lost',
    name: 'Closed Lost',
    color: '#ef4444',
    description: 'Deal fell through',
  },
};

export const ACTIVITY_TYPE_ICONS: Record<DealActivityType, string> = {
  created: '🎉',
  stage_changed: '🔄',
  value_updated: '💰',
  milestone_completed: '✅',
  document_uploaded: '📄',
  note_added: '📝',
  field_updated: '✏️',
};

export const ACTIVITY_TYPE_LABELS: Record<DealActivityType, string> = {
  created: 'Deal Created',
  stage_changed: 'Stage Changed',
  value_updated: 'Value Updated',
  milestone_completed: 'Milestone Completed',
  document_uploaded: 'Document Uploaded',
  note_added: 'Note Added',
  field_updated: 'Field Updated',
};
