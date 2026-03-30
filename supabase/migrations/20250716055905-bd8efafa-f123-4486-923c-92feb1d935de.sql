-- Create the trigger on shift_records table
CREATE TRIGGER trigger_shift_record_submitted
    AFTER INSERT ON public.shift_records
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_timesheet_tracking();