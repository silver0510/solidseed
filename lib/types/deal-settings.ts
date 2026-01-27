/**
 * Deal Settings Types
 *
 * Types for user-specific deal type settings and checklist templates
 */

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
