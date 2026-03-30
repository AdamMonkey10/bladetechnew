-- Fix the update_timesheet_tracking function
CREATE OR REPLACE FUNCTION public.update_timesheet_tracking()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    tracking_record RECORD;
BEGIN
    -- First, create tracking records for operators with time events but no tracking record
    INSERT INTO public.timesheet_tracking (operator_id, work_date, clockfy_events_exist, timesheet_submitted, days_overdue)
    SELECT DISTINCT 
        cte.operator_id,
        DATE(cte.clock_in) as work_date,
        true as clockfy_events_exist,
        CASE 
            WHEN sr.id IS NOT NULL THEN true 
            ELSE false 
        END as timesheet_submitted,
        CASE 
            WHEN sr.id IS NULL THEN EXTRACT(days FROM (CURRENT_DATE - DATE(cte.clock_in)))::INTEGER
            ELSE 0
        END as days_overdue
    FROM public.clockfy_time_events cte
    LEFT JOIN public.shift_records sr ON (
        sr.operator_id = cte.operator_id AND 
        sr.shift_date = DATE(cte.clock_in)
    )
    LEFT JOIN public.timesheet_tracking tt ON (
        tt.operator_id = cte.operator_id AND 
        tt.work_date = DATE(cte.clock_in)
    )
    WHERE cte.operator_id IS NOT NULL
        AND tt.id IS NULL
        AND DATE(cte.clock_in) < CURRENT_DATE
    ON CONFLICT (operator_id, work_date) DO NOTHING;

    -- Update existing tracking records
    FOR tracking_record IN 
        SELECT tt.id, tt.operator_id, tt.work_date, tt.timesheet_submitted, tt.days_overdue
        FROM public.timesheet_tracking tt
        WHERE tt.work_date < CURRENT_DATE
    LOOP
        -- Check if timesheet has been submitted since last check
        IF NOT tracking_record.timesheet_submitted THEN
            -- Check if timesheet now exists
            IF EXISTS (
                SELECT 1 FROM public.shift_records sr 
                WHERE sr.operator_id = tracking_record.operator_id 
                AND sr.shift_date = tracking_record.work_date
            ) THEN
                -- Mark as submitted
                UPDATE public.timesheet_tracking 
                SET 
                    timesheet_submitted = true,
                    timesheet_submitted_at = now(),
                    days_overdue = 0,
                    escalation_level = 'none',
                    updated_at = now()
                WHERE id = tracking_record.id;
            ELSE
                -- Update days overdue and escalation level
                UPDATE public.timesheet_tracking 
                SET 
                    days_overdue = EXTRACT(days FROM (CURRENT_DATE - work_date))::INTEGER,
                    escalation_level = CASE 
                        WHEN EXTRACT(days FROM (CURRENT_DATE - work_date))::INTEGER >= 6 THEN 'critical'
                        WHEN EXTRACT(days FROM (CURRENT_DATE - work_date))::INTEGER >= 3 THEN 'urgent'
                        WHEN EXTRACT(days FROM (CURRENT_DATE - work_date))::INTEGER >= 1 THEN 'warning'
                        ELSE 'none'
                    END,
                    updated_at = now()
                WHERE id = tracking_record.id;
            END IF;
        END IF;
    END LOOP;
END;
$function$