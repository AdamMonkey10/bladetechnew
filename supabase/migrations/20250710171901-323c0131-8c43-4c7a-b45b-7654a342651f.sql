-- Update shift_records table to use timestamp with time zone for start_time and end_time
-- This ensures we store complete datetime information with timezone context

-- First, add new columns with proper timezone support
ALTER TABLE public.shift_records 
ADD COLUMN start_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_timestamp TIMESTAMP WITH TIME ZONE;

-- Migrate existing data by combining shift_date with start_time/end_time
-- Assume existing times are in Europe/London timezone (UK business timezone)
UPDATE public.shift_records 
SET 
  start_timestamp = CASE 
    WHEN start_time IS NOT NULL THEN 
      (shift_date::text || ' ' || start_time::text)::timestamp AT TIME ZONE 'Europe/London'
    ELSE NULL
  END,
  end_timestamp = CASE 
    WHEN end_time IS NOT NULL THEN 
      (shift_date::text || ' ' || end_time::text)::timestamp AT TIME ZONE 'Europe/London'
    ELSE NULL
  END
WHERE start_time IS NOT NULL OR end_time IS NOT NULL;

-- Drop the old columns
ALTER TABLE public.shift_records 
DROP COLUMN start_time,
DROP COLUMN end_time;

-- Rename new columns to replace the old ones
ALTER TABLE public.shift_records 
RENAME COLUMN start_timestamp TO start_time;

ALTER TABLE public.shift_records 
RENAME COLUMN end_timestamp TO end_time;

-- Add comments for clarity
COMMENT ON COLUMN public.shift_records.start_time IS 'Shift start time with timezone information';
COMMENT ON COLUMN public.shift_records.end_time IS 'Shift end time with timezone information';