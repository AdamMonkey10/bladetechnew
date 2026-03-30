-- Backfill: Fix shift records that were incorrectly assigned to the previous day
-- when the shift actually started at or after 06:00
UPDATE public.shift_records sr
SET shift_date = (sr.start_time AT TIME ZONE 'UTC')::date
WHERE sr.start_time IS NOT NULL
  AND sr.end_time IS NOT NULL
  AND (sr.start_time::time >= time '06:00')  -- Shift started at or after 6am
  AND (sr.end_time::time < sr.start_time::time)  -- It's an overnight shift
  AND sr.shift_date = ((sr.start_time AT TIME ZONE 'UTC')::date - INTERVAL '1 day')::date  -- Currently saved to previous day
  AND sr.shift_date >= CURRENT_DATE - INTERVAL '60 days';  -- Only recent records

-- Update timesheet tracking to reflect the corrected shift dates
SELECT public.update_timesheet_tracking();