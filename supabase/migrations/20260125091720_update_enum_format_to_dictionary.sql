-- Update enum format from simple strings to dictionary objects with value/display pairs
-- This migration changes the enum structure in deal_types.enabled_fields

-- Update Residential Sale deal type enums
UPDATE deal_types
SET enabled_fields = jsonb_set(
  enabled_fields,
  '{enums}',
  '{
    "deal_side": [
      {"value": "buyer_side", "display": "Buyer Side"},
      {"value": "seller_side", "display": "Seller Side"},
      {"value": "dual_agency", "display": "Dual Agency"}
    ],
    "property_type": [
      {"value": "single_family", "display": "Single Family"},
      {"value": "condo", "display": "Condo"},
      {"value": "townhouse", "display": "Townhouse"},
      {"value": "multi_family", "display": "Multi Family"},
      {"value": "land", "display": "Land"}
    ],
    "financing_type": [
      {"value": "conventional", "display": "Conventional"},
      {"value": "fha", "display": "FHA"},
      {"value": "va", "display": "VA"},
      {"value": "usda", "display": "USDA"},
      {"value": "jumbo", "display": "Jumbo"},
      {"value": "heloc", "display": "HELOC"},
      {"value": "other", "display": "Other"}
    ]
  }'::jsonb
)
WHERE type_code = 'residential_sale';

-- Update Mortgage Loan deal type enums
UPDATE deal_types
SET enabled_fields = jsonb_set(
  enabled_fields,
  '{enums}',
  '{
    "loan_type": [
      {"value": "conventional", "display": "Conventional"},
      {"value": "fha", "display": "FHA"},
      {"value": "va", "display": "VA"},
      {"value": "usda", "display": "USDA"},
      {"value": "jumbo", "display": "Jumbo"},
      {"value": "heloc", "display": "HELOC"},
      {"value": "other", "display": "Other"}
    ],
    "loan_purpose": [
      {"value": "purchase", "display": "Purchase"},
      {"value": "refinance", "display": "Refinance"},
      {"value": "cash_out_refinance", "display": "Cash Out Refinance"},
      {"value": "construction", "display": "Construction"}
    ],
    "loan_term_years": [
      {"value": 15, "display": "15"},
      {"value": 20, "display": "20"},
      {"value": 25, "display": "25"},
      {"value": 30, "display": "30"}
    ],
    "employment_type": [
      {"value": "w2", "display": "W2"},
      {"value": "self_employed", "display": "Self Employed"},
      {"value": "retired", "display": "Retired"},
      {"value": "other", "display": "Other"}
    ]
  }'::jsonb
)
WHERE type_code = 'mortgage';
