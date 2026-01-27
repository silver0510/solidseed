-- Add "type" field to pipeline_stages to distinguish normal, won, and lost stages
-- This allows flexible terminal stage detection without hardcoding stage codes

-- Update residential sales deal type
UPDATE deal_types
SET pipeline_stages = '[
  {"code": "lead", "name": "Lead", "order": 1, "type": "normal"},
  {"code": "showing", "name": "Showing", "order": 2, "type": "normal"},
  {"code": "offer", "name": "Offer", "order": 3, "type": "normal"},
  {"code": "negotiation", "name": "Negotiation", "order": 4, "type": "normal"},
  {"code": "under_contract", "name": "Under Contract", "order": 5, "type": "normal"},
  {"code": "inspection", "name": "Inspection", "order": 6, "type": "normal"},
  {"code": "appraisal", "name": "Appraisal", "order": 7, "type": "normal"},
  {"code": "closing", "name": "Closing", "order": 8, "type": "normal"},
  {"code": "closed", "name": "Closed", "order": 9, "type": "won"},
  {"code": "lost", "name": "Lost", "order": 10, "type": "lost"}
]'::jsonb
WHERE type_code = 'residential_sales';

-- Update mortgage loan deal type
UPDATE deal_types
SET pipeline_stages = '[
  {"code": "lead", "name": "Lead", "order": 1, "type": "normal"},
  {"code": "prequalification", "name": "Prequalification", "order": 2, "type": "normal"},
  {"code": "application", "name": "Application", "order": 3, "type": "normal"},
  {"code": "processing", "name": "Processing", "order": 4, "type": "normal"},
  {"code": "underwriting", "name": "Underwriting", "order": 5, "type": "normal"},
  {"code": "approval", "name": "Approval", "order": 6, "type": "normal"},
  {"code": "closing", "name": "Closing", "order": 7, "type": "normal"},
  {"code": "funded", "name": "Funded", "order": 8, "type": "won"},
  {"code": "lost", "name": "Lost", "order": 9, "type": "lost"}
]'::jsonb
WHERE type_code = 'mortgage';
