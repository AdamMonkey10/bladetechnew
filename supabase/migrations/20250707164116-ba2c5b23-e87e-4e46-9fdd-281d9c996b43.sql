-- Create report recipients management tables
CREATE TABLE public.report_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report recipients table
CREATE TABLE public.report_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create junction table for flexible group assignments
CREATE TABLE public.recipient_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES public.report_recipients(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.report_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recipient_id, group_id)
);

-- Create report history table
CREATE TABLE public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  report_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'completed'
);

-- Enable RLS
ALTER TABLE public.report_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can manage report groups" ON public.report_groups
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage report recipients" ON public.report_recipients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage group members" ON public.recipient_group_members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view weekly reports" ON public.weekly_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create weekly reports" ON public.weekly_reports
  FOR INSERT WITH CHECK (auth.uid() = generated_by);

-- Insert default groups
INSERT INTO public.report_groups (name, description) VALUES
  ('Management', 'Executive summary recipients'),
  ('Operations', 'Production team recipients'),
  ('QC', 'Quality control team recipients');

-- Create weekly production report function
CREATE OR REPLACE FUNCTION public.generate_weekly_production_report(week_start_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    week_end_date DATE;
    prev_week_start DATE;
    prev_week_end DATE;
    report_data JSONB := '{}';
    production_metrics JSONB;
    qc_metrics JSONB;
    po_metrics JSONB;
BEGIN
    week_end_date := week_start_date + INTERVAL '6 days';
    prev_week_start := week_start_date - INTERVAL '7 days';
    prev_week_end := prev_week_start + INTERVAL '6 days';
    
    -- Production Metrics
    WITH current_week AS (
        SELECT 
            COUNT(*) as total_labels,
            SUM(quantity) as total_quantity,
            COUNT(DISTINCT operator) as active_operators,
            COUNT(DISTINCT po) as active_pos
        FROM public.printed_labels
        WHERE print_date BETWEEN week_start_date AND week_end_date
    ),
    previous_week AS (
        SELECT 
            COUNT(*) as prev_total_labels,
            SUM(quantity) as prev_total_quantity,
            COUNT(DISTINCT operator) as prev_active_operators,
            COUNT(DISTINCT po) as prev_active_pos
        FROM public.printed_labels
        WHERE print_date BETWEEN prev_week_start AND prev_week_end
    )
    SELECT jsonb_build_object(
        'current_week', jsonb_build_object(
            'total_labels', COALESCE(cw.total_labels, 0),
            'total_quantity', COALESCE(cw.total_quantity, 0),
            'active_operators', COALESCE(cw.active_operators, 0),
            'active_pos', COALESCE(cw.active_pos, 0)
        ),
        'previous_week', jsonb_build_object(
            'total_labels', COALESCE(pw.prev_total_labels, 0),
            'total_quantity', COALESCE(pw.prev_total_quantity, 0),
            'active_operators', COALESCE(pw.prev_active_operators, 0),
            'active_pos', COALESCE(pw.prev_active_pos, 0)
        ),
        'week_over_week', jsonb_build_object(
            'labels_change', CASE 
                WHEN COALESCE(pw.prev_total_labels, 0) = 0 THEN 0
                ELSE ROUND(((COALESCE(cw.total_labels, 0) - COALESCE(pw.prev_total_labels, 0))::numeric / COALESCE(pw.prev_total_labels, 1)::numeric * 100), 2)
            END,
            'quantity_change', CASE 
                WHEN COALESCE(pw.prev_total_quantity, 0) = 0 THEN 0
                ELSE ROUND(((COALESCE(cw.total_quantity, 0) - COALESCE(pw.prev_total_quantity, 0))::numeric / COALESCE(pw.prev_total_quantity, 1)::numeric * 100), 2)
            END
        )
    ) INTO production_metrics
    FROM current_week cw
    CROSS JOIN previous_week pw;
    
    -- QC Metrics
    WITH qc_data AS (
        SELECT 
            COUNT(*) as total_tests,
            AVG(defect_rate) as avg_defect_rate,
            SUM(total_defects) as total_defects,
            SUM(total_saws) as total_saws
        FROM public.milwaukee_test_reports
        WHERE test_date BETWEEN week_start_date AND week_end_date
    )
    SELECT jsonb_build_object(
        'total_tests', COALESCE(total_tests, 0),
        'avg_defect_rate', ROUND(COALESCE(avg_defect_rate, 0), 2),
        'total_defects', COALESCE(total_defects, 0),
        'total_saws', COALESCE(total_saws, 0),
        'overall_defect_rate', CASE 
            WHEN COALESCE(total_saws, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(total_defects, 0)::numeric / COALESCE(total_saws, 1)::numeric * 100), 2)
        END
    ) INTO qc_metrics
    FROM qc_data;
    
    -- PO Progress Metrics
    WITH po_data AS (
        SELECT 
            COUNT(*) as total_pos,
            COUNT(*) FILTER (WHERE status = true) as completed_pos,
            COUNT(*) FILTER (WHERE status = false AND delivery_date < CURRENT_DATE) as overdue_pos,
            COUNT(*) FILTER (WHERE status = false AND delivery_date <= CURRENT_DATE + INTERVAL '7 days') as due_this_week,
            AVG(progress_percentage) as avg_progress
        FROM public.customer_pos
        WHERE created_at <= week_end_date
    )
    SELECT jsonb_build_object(
        'total_pos', COALESCE(total_pos, 0),
        'completed_pos', COALESCE(completed_pos, 0),
        'overdue_pos', COALESCE(overdue_pos, 0),
        'due_this_week', COALESCE(due_this_week, 0),
        'avg_progress', ROUND(COALESCE(avg_progress, 0), 2),
        'completion_rate', CASE 
            WHEN COALESCE(total_pos, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(completed_pos, 0)::numeric / COALESCE(total_pos, 1)::numeric * 100), 2)
        END
    ) INTO po_metrics
    FROM po_data;
    
    -- Combine all metrics
    report_data := jsonb_build_object(
        'week_start_date', week_start_date,
        'week_end_date', week_end_date,
        'generated_at', now(),
        'production_metrics', production_metrics,
        'qc_metrics', qc_metrics,
        'po_metrics', po_metrics
    );
    
    RETURN report_data;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_printed_labels_print_date ON public.printed_labels(print_date);
CREATE INDEX idx_milwaukee_test_reports_test_date ON public.milwaukee_test_reports(test_date);
CREATE INDEX idx_customer_pos_created_at ON public.customer_pos(created_at);
CREATE INDEX idx_customer_pos_delivery_date ON public.customer_pos(delivery_date);

-- Create trigger for updated_at
CREATE TRIGGER update_report_groups_updated_at
    BEFORE UPDATE ON public.report_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_recipients_updated_at
    BEFORE UPDATE ON public.report_recipients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();