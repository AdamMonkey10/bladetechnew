-- Fix Rob's clock-out time for 2025-11-18 shift
-- This corrects an erroneous 23.88 hour shift to a proper 12.01 hour shift
UPDATE clockfy_time_events
SET 
  clock_out = '2025-11-19T06:00:00Z',
  total_hours = EXTRACT(EPOCH FROM ('2025-11-19T06:00:00Z'::timestamptz - clock_in)) / 3600,
  updated_at = now()
WHERE id = '8833d378-382a-41de-9b07-1908dd197b5a'
  AND clockfy_record_id = '31a4ea48-f6b3-4eb7-9468-89b3bf2ef62b';