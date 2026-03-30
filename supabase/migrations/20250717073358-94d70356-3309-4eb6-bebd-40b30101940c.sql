-- Fix Craig's timesheet data entry error
-- Change 1015 hours to 10.15 hours on July 14th, 2025
UPDATE public.shift_records 
SET production_data = jsonb_set(
    production_data, 
    '{hours_booked}', 
    '"10.15"'::jsonb
)
WHERE id = 'e746999a-d91d-4c42-9062-d00e6863bf04' 
  AND shift_date = '2025-07-14';