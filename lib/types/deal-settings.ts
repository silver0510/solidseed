/**
 * Deal Settings Types
 *
 * Types for user-specific deal type settings, checklist templates, and preferences
 */

// Checklist Templates
export interface ChecklistTemplateItem {
  name: string;
}

export interface UserDealTypeSetting {
  id: string;
  user_id: string;
  deal_type_id: string;
  checklist_template: ChecklistTemplateItem[];
  created_at: string;
  updated_at: string;
}

export interface UpdateChecklistTemplateInput {
  deal_type_id: string;
  checklist_template: ChecklistTemplateItem[];
}

export interface GetDealSettingsResponse {
  settings: UserDealTypeSetting[];
  deal_types: {
    id: string;
    type_name: string;
    type_code: string;
  }[];
}

// User Deal Type Preferences (Onboarding)
export interface UserDealPreferences {
  id: string;
  user_id: string;
  residential_sale_enabled: boolean;
  mortgage_loan_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdatePreferencesInput {
  residential_sale_enabled?: boolean;
  mortgage_loan_enabled?: boolean;
}

export interface CreatePreferencesInput {
  user_id: string;
  residential_sale_enabled: boolean;
  mortgage_loan_enabled: boolean;
  onboarding_completed?: boolean;
}
