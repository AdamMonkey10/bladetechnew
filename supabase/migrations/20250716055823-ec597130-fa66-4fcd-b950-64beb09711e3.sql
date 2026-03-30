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
$function$;