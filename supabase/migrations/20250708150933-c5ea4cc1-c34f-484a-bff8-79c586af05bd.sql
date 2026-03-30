-- Fix the clock-in time for Mathew Hall's record
UPDATE public.clockfy_time_events 
SET clock_in = '2025-07-08 06:58:59.322+00'::timestamp with time zone,
    updated_at = now()
WHERE clockfy_record_id = 'rec_matt_today_001' 
  AND clock_in = '2025-07-08 08:18:58.947518+00'::timestamp with time zone;