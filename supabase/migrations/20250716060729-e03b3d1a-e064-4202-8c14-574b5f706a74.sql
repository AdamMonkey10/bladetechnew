-- Fix Rob's timesheet date from July 16th to July 15th
UPDATE public.shift_records 
SET 
    shift_date = '2025-07-15'
WHERE operator_id = '427b457a-ecbf-4907-90ae-94d250c977c9' 
  AND shift_date = '2025-07-16';