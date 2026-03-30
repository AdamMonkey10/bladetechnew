-- Update Matt's clock in and out times for today
UPDATE public.clockfy_time_events 
SET 
  clock_in = DATE_TRUNC('day', clock_in) + INTERVAL '7 hours 55 minutes',
  clock_out = DATE_TRUNC('day', clock_in) + INTERVAL '16 hours 30 minutes',
  total_hours = 8.583333, -- 16:30 - 7:55 = 8h 35m = 8.583333 hours
  updated_at = now()
WHERE 
  employee_id IN (
    SELECT id FROM public.clockfy_employees 
    WHERE name ILIKE '%Matt%'
  )
  AND DATE(clock_in) = CURRENT_DATE;