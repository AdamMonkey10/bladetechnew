-- Fix existing night shift records that end before 6am
-- These should be assigned to the previous calendar day (6am-6am business day)

UPDATE public.shift_records
SET shift_date = (shift_date - INTERVAL '1 day')::date
WHERE 
  -- Only update records where end_time exists and is before start_time (overnight shift)
  end_time IS NOT NULL 
  AND start_time IS NOT NULL
  -- Check if it's an overnight shift (end hour < start hour)
  AND EXTRACT(HOUR FROM end_time) < EXTRACT(HOUR FROM start_time)
  -- Check if shift ends before 6am
  AND EXTRACT(HOUR FROM end_time) < 6
  -- Avoid updating records that have already been corrected
  AND shift_date >= start_time::date;