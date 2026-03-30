-- Create a trigger function to update timesheet tracking when shift records are inserted
CREATE OR REPLACE FUNCTION public.trigger_update_timesheet_tracking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Call the existing update_timesheet_tracking function
    PERFORM public.update_timesheet_tracking();
    
    -- Also directly update the specific tracking record for this submission
    UPDATE public.timesheet_tracking 
    SET 
        timesheet_submitted = true,
        timesheet_submitted_at = now(),
        days_overdue = 0,
        escalation_level = 'none',
        updated_at = now()
    WHERE operator_id = NEW.operator_id 
      AND work_date = NEW.shift_date
      AND timesheet_submitted = false;
    
    -- If no tracking record exists, create one
    INSERT INTO public.timesheet_tracking (operator_id, work_date, clockfy_events_exist, timesheet_submitted, timesheet_submitted_at, days_overdue, escalation_level)
    SELECT NEW.operator_id, NEW.shift_date, true, true, now(), 0, 'none'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.timesheet_tracking 
        WHERE operator_id = NEW.operator_id AND work_date = NEW.shift_date
    );
    
    RETURN NEW;
END;
$function$

-- Create the trigger on shift_records table
CREATE TRIGGER trigger_shift_record_submitted
    AFTER INSERT ON public.shift_records
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_timesheet_tracking();

-- Fix the current discrepancy for Rob's July 14th timesheet
UPDATE public.timesheet_tracking 
SET 
    timesheet_submitted = true,
    timesheet_submitted_at = now(),
    days_overdue = 0,
    escalation_level = 'none',
    updated_at = now()
WHERE operator_id = '427b457a-ecbf-4907-90ae-94d250c977c9' 
  AND work_date = '2025-07-14'
  AND timesheet_submitted = false;