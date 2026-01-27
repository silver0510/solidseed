-- Add "lost" stage to mortgage loan deal type
-- This allows tracking mortgage deals that fell through before being funded

UPDATE deal_types
SET pipeline_stages = '[
  {"code": "lead", "name": "Lead", "order": 1},
  {"code": "prequalification", "name": "Prequalification", "order": 2},
  {"code": "application", "name": "Application", "order": 3},
  {"code": "processing", "name": "Processing", "order": 4},
  {"code": "underwriting", "name": "Underwriting", "order": 5},
  {"code": "approval", "name": "Approval", "order": 6},
  {"code": "closing", "name": "Closing", "order": 7},
  {"code": "funded", "name": "Funded", "order": 8},
  {"code": "lost", "name": "Lost", "order": 9}
]'::jsonb
WHERE type_code = 'mortgage';
