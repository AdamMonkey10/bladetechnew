-- Add example line item statuses to existing records
UPDATE customer_pos 
SET items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item ? 'status' THEN item
      ELSE item || jsonb_build_object('status', 'pending')
    END
  )
  FROM jsonb_array_elements(items) AS item
)
WHERE items IS NOT NULL AND jsonb_array_length(items) > 0;

-- Add a check to ensure line items have status field
COMMENT ON COLUMN customer_pos.items IS 'JSON array of line items with sku, quantity, dispatch_date, and status fields';