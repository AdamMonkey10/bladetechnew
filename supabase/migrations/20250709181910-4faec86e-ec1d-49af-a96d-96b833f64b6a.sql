-- Create timesheet tracking table for persistent timesheet management
CREATE TABLE public.timesheet_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES public.operators(id) NOT NULL,
  work_date DATE NOT NULL,
  clockfy_events_exist BOOLEAN DEFAULT false,
  timesheet_submitted BOOLEAN DEFAULT false,
  timesheet_submitted_at TIMESTAMP WITH TIME ZONE,
  days_overdue INTEGER DEFAULT 0,
  escalation_level TEXT DEFAULT 'none' CHECK (escalation_level IN ('none', 'warning', 'urgent', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(operator_id, work_date)
);

-- Enable RLS
ALTER TABLE public.timesheet_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for timesheet tracking
CREATE POLICY "Authenticated users can view timesheet tracking" 
ON public.timesheet_tracking 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create timesheet tracking" 
ON public.timesheet_tracking 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update timesheet tracking" 
ON public.timesheet_tracking 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for updated_at
CREATE TRIGGER update_timesheet_tracking_updated_at
BEFORE UPDATE ON public.timesheet_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_timesheet_tracking_operator_date ON public.timesheet_tracking(operator_id, work_date);
CREATE INDEX idx_timesheet_tracking_overdue ON public.timesheet_tracking(days_overdue) WHERE days_overdue > 0;
CREATE INDEX idx_timesheet_tracking_escalation ON public.timesheet_tracking(escalation_level) WHERE escalation_level != 'none';

-- Create function to update timesheet tracking daily
CREATE OR REPLACE FUNCTION public.update_timesheet_tracking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;