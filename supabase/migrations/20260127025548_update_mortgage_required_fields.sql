-- Update Mortgage Loan deal type to make purchase_price, down_payment, and loan_amount required
-- This aligns with the UI requirements where these three fields are mandatory

UPDATE deal_types
SET enabled_fields = jsonb_set(
  jsonb_set(
    enabled_fields,
    '{required}',
    '["loan_amount", "loan_type", "loan_purpose", "property_address", "purchase_price", "down_payment"]'::jsonb
  ),
  '{optional}',
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements_text(enabled_fields->'optional') elem
    WHERE elem NOT IN ('purchase_price', 'down_payment')
  )
)
WHERE type_code = 'mortgage';
