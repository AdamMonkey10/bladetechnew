
-- Fix clockfy_time_events: drop and recreate with correct schema
DROP TABLE IF EXISTS public.clockfy_shift_assignments CASCADE;
DROP TABLE IF EXISTS public.clockfy_employee_mapping CASCADE;
DROP TABLE IF EXISTS public.clockfy_sync_log CASCADE;
DROP TABLE IF EXISTS public.clockfy_time_events CASCADE;
DROP TABLE IF EXISTS public.clockfy_employees CASCADE;

CREATE TABLE public.clockfy_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clockfy_employee_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  pin TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  mapped_operator_id UUID REFERENCES public.operators(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.clockfy_time_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clockfy_record_id UUID NOT NULL UNIQUE,
  employee_id UUID REFERENCES public.clockfy_employees(id),
  operator_id UUID REFERENCES public.operators(id),
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.clockfy_shift_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clockfy_assignment_id UUID NOT NULL UNIQUE,
  employee_id UUID REFERENCES public.clockfy_employees(id),
  shift_template_id UUID,
  start_date DATE NOT NULL,
  end_date DATE,
  shift_pattern JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.clockfy_employee_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clockfy_employee_id UUID REFERENCES public.clockfy_employees(id) NOT NULL,
  operator_id UUID REFERENCES public.operators(id) NOT NULL,
  mapping_type TEXT NOT NULL DEFAULT 'manual',
  confidence_score NUMERIC DEFAULT 1.0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clockfy_employee_id, operator_id)
);

CREATE TABLE public.clockfy_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  raw_payload JSONB,
  records_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fix raw_material_specifications: drop and recreate with correct schema
DROP TABLE IF EXISTS public.raw_material_specifications CASCADE;

CREATE TABLE public.raw_material_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_code TEXT NOT NULL,
  height_min NUMERIC,
  height_max NUMERIC,
  gauge_min NUMERIC,
  gauge_max NUMERIC,
  set_left_min NUMERIC,
  set_left_max NUMERIC,
  set_right_min NUMERIC,
  set_right_max NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to raw_materials
ALTER TABLE public.raw_materials ADD COLUMN IF NOT EXISTS revision TEXT DEFAULT '1.0';
ALTER TABLE public.raw_materials ADD COLUMN IF NOT EXISTS specification_date DATE DEFAULT CURRENT_DATE;

-- Fix product_specifications: drop and recreate with correct full schema
DROP TABLE IF EXISTS public.product_specifications CASCADE;

CREATE TABLE public.product_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  height_min DECIMAL(10,4),
  height_max DECIMAL(10,4),
  height_target DECIMAL(10,4),
  blade_width_min DECIMAL(10,4),
  blade_width_max DECIMAL(10,4),
  blade_width_target DECIMAL(10,4),
  blade_body_min DECIMAL(10,4),
  blade_body_max DECIMAL(10,4),
  blade_body_target DECIMAL(10,4),
  blade_bottom_min DECIMAL(10,4),
  blade_bottom_max DECIMAL(10,4),
  blade_bottom_target DECIMAL(10,4),
  tooth_pitch_min DECIMAL(10,4),
  tooth_pitch_max DECIMAL(10,4),
  tooth_pitch_target DECIMAL(10,4),
  rake_angle_min DECIMAL(10,4),
  rake_angle_max DECIMAL(10,4),
  rake_angle_target DECIMAL(10,4),
  clearance_angle_min DECIMAL(10,4),
  clearance_angle_max DECIMAL(10,4),
  clearance_angle_target DECIMAL(10,4),
  kerf_min DECIMAL(10,4),
  kerf_max DECIMAL(10,4),
  kerf_target DECIMAL(10,4),
  gauge_min DECIMAL(10,4),
  gauge_max DECIMAL(10,4),
  gauge_target DECIMAL(10,4),
  tooth_set_min DECIMAL(10,4),
  tooth_set_max DECIMAL(10,4),
  tooth_set_target DECIMAL(10,4),
  set_left_min DECIMAL(10,4),
  set_left_max DECIMAL(10,4),
  set_left_target DECIMAL(10,4),
  set_right_min DECIMAL(10,4),
  set_right_max DECIMAL(10,4),
  set_right_target DECIMAL(10,4),
  dross_min DECIMAL(10,4),
  dross_max DECIMAL(10,4),
  dross_target DECIMAL(10,4),
  flatness_min DECIMAL(10,4),
  flatness_max DECIMAL(10,4),
  flatness_target DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_code)
);

-- Add missing columns to printed_labels
ALTER TABLE public.printed_labels ADD COLUMN IF NOT EXISTS invoice TEXT;
ALTER TABLE public.printed_labels ADD COLUMN IF NOT EXISTS line_item_index INTEGER DEFAULT 0;
ALTER TABLE public.printed_labels ADD COLUMN IF NOT EXISTS goods_received_id UUID REFERENCES public.goods_received(id);

-- Add missing columns to customer_pos
ALTER TABLE public.customer_pos ADD COLUMN IF NOT EXISTS boxes_printed INTEGER DEFAULT 0;
ALTER TABLE public.customer_pos ADD COLUMN IF NOT EXISTS total_printed INTEGER DEFAULT 0;
ALTER TABLE public.customer_pos ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.customer_pos ADD COLUMN IF NOT EXISTS line_item_progress JSONB DEFAULT '{}';
ALTER TABLE public.customer_pos ADD COLUMN IF NOT EXISTS customer_template_id UUID REFERENCES public.customers(id);
ALTER TABLE public.customer_pos ADD COLUMN IF NOT EXISTS warehouse_quantity_moved INTEGER DEFAULT 0;
ALTER TABLE public.customer_pos ADD COLUMN IF NOT EXISTS warehouse_status TEXT DEFAULT 'pending';

-- Add missing columns to shift_records
ALTER TABLE public.shift_records ADD COLUMN IF NOT EXISTS start_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.shift_records ADD COLUMN IF NOT EXISTS end_timestamp TIMESTAMP WITH TIME ZONE;

-- Add missing columns to warehouse tables
ALTER TABLE public.warehouse_products ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10,2);
ALTER TABLE public.warehouse_stock_movements ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10,2);

-- Add missing columns to printer_settings
ALTER TABLE public.printer_settings ADD COLUMN IF NOT EXISTS label_width_mm NUMERIC DEFAULT 101;
ALTER TABLE public.printer_settings ADD COLUMN IF NOT EXISTS label_height_mm NUMERIC DEFAULT 101;
ALTER TABLE public.printer_settings ADD COLUMN IF NOT EXISTS template_name TEXT DEFAULT 'Default Template';

-- Enable RLS on new tables
ALTER TABLE public.clockfy_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_time_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_employee_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables
CREATE POLICY "auth_select" ON public.clockfy_employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_time_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_time_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_shift_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_shift_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_employee_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_employee_mapping FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_sync_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_sync_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.raw_material_specifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.raw_material_specifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.product_specifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.product_specifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add update_timesheet_tracking as a standalone callable RPC function
CREATE OR REPLACE FUNCTION public.update_timesheet_tracking(p_operator_id UUID, p_week_number INTEGER, p_year INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO public.timesheet_tracking (operator_id, operator_name, week_number, year, actual_shifts, missing_shifts, compliance_rate, status, last_updated)
  SELECT
    p_operator_id,
    o.operator_name,
    p_week_number,
    p_year,
    COUNT(sr.id)::INTEGER,
    GREATEST(0, 5 - COUNT(sr.id)::INTEGER),
    LEAST(100, COUNT(sr.id)::DECIMAL / 5 * 100),
    CASE WHEN COUNT(sr.id) >= 5 THEN 'complete' ELSE 'incomplete' END,
    now()
  FROM public.operators o
  LEFT JOIN public.shift_records sr ON sr.operator_id = p_operator_id AND sr.week_number = p_week_number AND sr.year = p_year
  WHERE o.id = p_operator_id
  GROUP BY o.operator_name
  ON CONFLICT (operator_id, week_number, year) DO UPDATE SET
    actual_shifts = EXCLUDED.actual_shifts,
    missing_shifts = EXCLUDED.missing_shifts,
    compliance_rate = EXCLUDED.compliance_rate,
    status = EXCLUDED.status,
    last_updated = now();
END;
$$ LANGUAGE plpgsql;

-- Add OEE functions
CREATE OR REPLACE FUNCTION public.calculate_daily_oee_summary(target_date DATE, target_rates JSONB)
RETURNS void AS $$
DECLARE
  machine_rec RECORD;
  planned_minutes INTEGER;
  actual_minutes INTEGER;
  total_pcs INTEGER;
  defect_pcs INTEGER;
  target_rate NUMERIC;
BEGIN
  FOR machine_rec IN SELECT DISTINCT machine_id, machine_name FROM public.shift_records WHERE shift_date = target_date AND machine_id IS NOT NULL
  LOOP
    SELECT
      COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 0)::INTEGER,
      COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60) - SUM(COALESCE(downtime_minutes, 0)) - SUM(COALESCE(setup_time_minutes, 0)), 0)::INTEGER,
      COALESCE(SUM(boxes_produced), 0)::INTEGER
    INTO planned_minutes, actual_minutes, total_pcs
    FROM public.shift_records
    WHERE shift_date = target_date AND machine_id = machine_rec.machine_id;

    target_rate := COALESCE((target_rates->>machine_rec.machine_id)::NUMERIC, 60);
    defect_pcs := 0;

    INSERT INTO public.oee_daily_summary (summary_date, machine_id, machine_name, planned_time_minutes, actual_run_time_minutes, total_pieces, good_pieces, defect_pieces, availability, performance, quality, oee, week_number, year, shift_count)
    VALUES (
      target_date, machine_rec.machine_id, machine_rec.machine_name,
      planned_minutes, actual_minutes, total_pcs, total_pcs - defect_pcs, defect_pcs,
      CASE WHEN planned_minutes > 0 THEN ROUND(actual_minutes::NUMERIC / planned_minutes * 100, 2) ELSE 0 END,
      CASE WHEN actual_minutes > 0 AND target_rate > 0 THEN ROUND(total_pcs::NUMERIC / (actual_minutes * target_rate / 60) * 100, 2) ELSE 0 END,
      CASE WHEN total_pcs > 0 THEN ROUND((total_pcs - defect_pcs)::NUMERIC / total_pcs * 100, 2) ELSE 100 END,
      0, EXTRACT(WEEK FROM target_date)::INTEGER, EXTRACT(YEAR FROM target_date)::INTEGER,
      (SELECT COUNT(*) FROM public.shift_records WHERE shift_date = target_date AND machine_id = machine_rec.machine_id)::INTEGER
    )
    ON CONFLICT (summary_date, machine_id) DO UPDATE SET
      machine_name = EXCLUDED.machine_name,
      planned_time_minutes = EXCLUDED.planned_time_minutes,
      actual_run_time_minutes = EXCLUDED.actual_run_time_minutes,
      total_pieces = EXCLUDED.total_pieces,
      good_pieces = EXCLUDED.good_pieces,
      defect_pieces = EXCLUDED.defect_pieces,
      availability = EXCLUDED.availability,
      performance = EXCLUDED.performance,
      quality = EXCLUDED.quality,
      shift_count = EXCLUDED.shift_count,
      updated_at = now();

    UPDATE public.oee_daily_summary
    SET oee = ROUND(availability * performance * quality / 10000, 2)
    WHERE summary_date = target_date AND machine_id = machine_rec.machine_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.populate_oee_summaries(start_date DATE, end_date DATE, target_rates JSONB)
RETURNS void AS $$
DECLARE
  current_d DATE;
BEGIN
  current_d := start_date;
  WHILE current_d <= end_date LOOP
    PERFORM public.calculate_daily_oee_summary(current_d, target_rates);
    current_d := current_d + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_weekly_production_report(week_start_date DATE)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'week_start', week_start_date,
    'week_end', week_start_date + INTERVAL '6 days',
    'total_shifts', (SELECT COUNT(*) FROM shift_records WHERE shift_date BETWEEN week_start_date AND week_start_date + INTERVAL '6 days'),
    'total_boxes', (SELECT COALESCE(SUM(boxes_produced), 0) FROM shift_records WHERE shift_date BETWEEN week_start_date AND week_start_date + INTERVAL '6 days'),
    'total_hours', (SELECT COALESCE(SUM(total_hours), 0) FROM shift_records WHERE shift_date BETWEEN week_start_date AND week_start_date + INTERVAL '6 days')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clockfy_time_events_operator_id ON public.clockfy_time_events(operator_id);
CREATE INDEX IF NOT EXISTS idx_clockfy_time_events_clock_in ON public.clockfy_time_events(clock_in);
CREATE INDEX IF NOT EXISTS idx_clockfy_time_events_operator_date ON public.clockfy_time_events(operator_id, clock_in);
CREATE INDEX IF NOT EXISTS idx_shift_records_week ON public.shift_records(week_number, year);
CREATE INDEX IF NOT EXISTS idx_shift_records_date ON public.shift_records(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_records_operator ON public.shift_records(operator_id);
CREATE INDEX IF NOT EXISTS idx_printed_labels_sku_po ON public.printed_labels(sku, po);
CREATE INDEX IF NOT EXISTS idx_customer_pos_sku ON public.customer_pos(sku);
