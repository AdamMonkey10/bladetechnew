-- Check and fix the escalation_level constraint
-- First, let's see what values are currently allowed by dropping and recreating the constraint

-- Drop the existing constraint
ALTER TABLE public.timesheet_tracking DROP CONSTRAINT IF EXISTS timesheet_tracking_escalation_level_check;

-- Add the correct constraint with the proper values
ALTER TABLE public.timesheet_tracking 
ADD CONSTRAINT timesheet_tracking_escalation_level_check 
CHECK (escalation_level IN ('none', 'late', 'critical'));

-- Update any existing invalid values to 'none'
UPDATE public.timesheet_tracking 
SET escalation_level = 'none' 
WHERE escalation_level NOT IN ('none', 'late', 'critical');