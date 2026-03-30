-- Backfill Rob's recent labels that are missing box numbers
-- Find Rob's operator_id first, then update his recent labels with sequential box numbers

-- Get Rob's recent labels that need box numbers
WITH robs_recent_labels AS (
  SELECT id, created_at, po, sku, quantity
  FROM printed_labels 
  WHERE operator = 'Rob' 
    AND box_number IS NULL 
    AND print_date >= CURRENT_DATE - INTERVAL '1 day'
  ORDER BY created_at DESC
  LIMIT 10
),
-- Generate sequential box numbers for Rob's labels
box_numbers AS (
  SELECT 
    id,
    'BOX-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((
      SELECT current_number + ROW_NUMBER() OVER (ORDER BY created_at)
      FROM box_number_sequences 
      WHERE year = EXTRACT(YEAR FROM NOW())
    )::TEXT, 4, '0') as new_box_number
  FROM robs_recent_labels
)
-- Update Rob's labels with the generated box numbers
UPDATE printed_labels 
SET box_number = box_numbers.new_box_number
FROM box_numbers
WHERE printed_labels.id = box_numbers.id;

-- Update the box number sequence to reflect the new numbers we just used
UPDATE box_number_sequences 
SET current_number = current_number + (
  SELECT COUNT(*) 
  FROM printed_labels 
  WHERE operator = 'Rob' 
    AND box_number IS NULL 
    AND print_date >= CURRENT_DATE - INTERVAL '1 day'
)
WHERE year = EXTRACT(YEAR FROM NOW());