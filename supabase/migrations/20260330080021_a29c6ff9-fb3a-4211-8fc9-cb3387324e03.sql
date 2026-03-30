
-- Core tables for BladeTech

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_code TEXT UNIQUE NOT NULL,
  description TEXT,
  box_amount INTEGER DEFAULT 1,
  revision TEXT DEFAULT '',
  packing_instructions TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.operators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_name TEXT NOT NULL,
  operator_code TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  clockfy_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_name TEXT NOT NULL,
  machine_code TEXT UNIQUE NOT NULL,
  machine_type TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.raw_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_name TEXT NOT NULL,
  material_code TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_name TEXT NOT NULL,
  equipment_serial TEXT,
  equipment_type TEXT,
  manufacturer TEXT,
  model TEXT,
  calibration_frequency_months INTEGER DEFAULT 12,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_code TEXT UNIQUE NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  unit TEXT,
  location TEXT,
  minimum_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.milwaukee_test_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  operator_id UUID REFERENCES public.operators(id),
  machine_id UUID REFERENCES public.machines(id),
  test_date DATE NOT NULL,
  shift TEXT,
  po TEXT,
  total_saws INTEGER,
  total_defects INTEGER,
  defect_rate DECIMAL(5,2),
  test_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.goods_received (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_item_id UUID REFERENCES public.stock_items(id),
  quantity_received INTEGER NOT NULL DEFAULT 0,
  received_date DATE NOT NULL DEFAULT now(),
  supplier TEXT,
  reference_number TEXT,
  notes TEXT,
  pallet_number INTEGER,
  sku TEXT,
  invoice TEXT,
  height DECIMAL(8,2),
  gauge DECIMAL(8,2),
  set_left_1 DECIMAL(8,2),
  set_left_2 DECIMAL(8,2),
  set_right_1 DECIMAL(8,2),
  set_right_2 DECIMAL(8,2),
  set_left_avg DECIMAL(8,2),
  set_right_avg DECIMAL(8,2),
  good_status BOOLEAN DEFAULT true,
  width DECIMAL(8,4),
  tooth_pitch DECIMAL(8,4),
  rake_angle DECIMAL(8,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.goods_out (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  customer TEXT,
  po_number TEXT,
  dispatch_date DATE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.calibration_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id),
  equipment_name TEXT NOT NULL,
  equipment_serial TEXT,
  calibration_date DATE NOT NULL,
  next_calibration_date DATE,
  calibration_data JSONB,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_pos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  po_number TEXT NOT NULL,
  po_date DATE NOT NULL,
  delivery_date DATE,
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  items JSONB,
  notes TEXT,
  sku TEXT,
  quantity INTEGER,
  order_quantity INTEGER,
  produced_quantity INTEGER DEFAULT 0,
  progress DECIMAL(5,2) DEFAULT 0,
  priority TEXT DEFAULT 'normal',
  customer_id UUID REFERENCES public.customers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.shift_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES public.operators(id),
  machine_id UUID REFERENCES public.machines(id),
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  production_data JSONB,
  notes TEXT,
  sku TEXT,
  boxes_produced INTEGER DEFAULT 0,
  total_hours DECIMAL(4,2),
  operator_name TEXT,
  machine_name TEXT,
  product_code TEXT,
  week_number INTEGER,
  year INTEGER,
  downtime_minutes INTEGER DEFAULT 0,
  downtime_reason TEXT,
  setup_time_minutes INTEGER DEFAULT 0,
  activities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.archive_shift_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID,
  user_id UUID,
  operator_id UUID,
  machine_id UUID,
  shift_date DATE,
  shift_type TEXT,
  start_time TIME,
  end_time TIME,
  production_data JSONB,
  notes TEXT,
  sku TEXT,
  boxes_produced INTEGER DEFAULT 0,
  total_hours DECIMAL(4,2),
  operator_name TEXT,
  machine_name TEXT,
  product_code TEXT,
  week_number INTEGER,
  year INTEGER,
  downtime_minutes INTEGER DEFAULT 0,
  downtime_reason TEXT,
  setup_time_minutes INTEGER DEFAULT 0,
  activities JSONB DEFAULT '[]'::jsonb,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archive_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.printed_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  po TEXT,
  line_number INTEGER,
  box_number INTEGER,
  date_printed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quantity INTEGER DEFAULT 1,
  session_id UUID
);

CREATE TABLE public.label_printing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  po TEXT,
  start_box INTEGER,
  end_box INTEGER,
  total_labels INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.printer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  printer_ip TEXT NOT NULL DEFAULT '192.168.1.100',
  printer_port INTEGER NOT NULL DEFAULT 9100,
  label_width DECIMAL(5,2) DEFAULT 4.0,
  label_height DECIMAL(5,2) DEFAULT 6.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pallet_number TEXT NOT NULL,
  sku TEXT,
  po TEXT,
  status TEXT DEFAULT 'open',
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pallet_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pallet_id UUID REFERENCES public.pallets(id) ON DELETE CASCADE,
  printed_label_id UUID REFERENCES public.printed_labels(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.box_number_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  po TEXT NOT NULL,
  last_box_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sku, po)
);

CREATE TABLE public.pallet_number_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix TEXT NOT NULL DEFAULT 'PLT',
  last_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.product_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10,2) DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.product_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT,
  height_min DECIMAL(10,4),
  height_max DECIMAL(10,4),
  height_target DECIMAL(10,4),
  blade_width_min DECIMAL(10,4),
  blade_width_max DECIMAL(10,4),
  blade_width_target DECIMAL(10,4),
  blade_body_min DECIMAL(10,4),
  blade_body_max DECIMAL(10,4),
  blade_body_target DECIMAL(10,4),
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.raw_material_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_material_id UUID REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  specification_name TEXT NOT NULL,
  min_value DECIMAL(10,4),
  max_value DECIMAL(10,4),
  target_value DECIMAL(10,4),
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.oee_daily_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_date DATE NOT NULL,
  machine_id UUID REFERENCES public.machines(id),
  machine_name TEXT,
  availability DECIMAL(5,2),
  performance DECIMAL(5,2),
  quality DECIMAL(5,2),
  oee DECIMAL(5,2),
  planned_time_minutes INTEGER,
  actual_run_time_minutes INTEGER,
  total_pieces INTEGER,
  good_pieces INTEGER,
  defect_pieces INTEGER,
  downtime_minutes INTEGER,
  setup_minutes INTEGER,
  week_number INTEGER,
  year INTEGER,
  shift_count INTEGER DEFAULT 0,
  operator_count INTEGER DEFAULT 0,
  sku_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(summary_date, machine_id)
);

CREATE TABLE public.timesheet_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID REFERENCES public.operators(id),
  operator_name TEXT,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  expected_shifts INTEGER DEFAULT 5,
  actual_shifts INTEGER DEFAULT 0,
  missing_shifts INTEGER DEFAULT 0,
  compliance_rate DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'incomplete',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(operator_id, week_number, year)
);

-- Clockify integration tables
CREATE TABLE public.clockfy_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clockfy_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.clockfy_time_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clockfy_id TEXT,
  employee_id TEXT,
  employee_name TEXT,
  event_type TEXT NOT NULL,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  project TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.clockfy_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.clockfy_employee_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clockfy_employee_id TEXT NOT NULL,
  operator_id UUID REFERENCES public.operators(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clockfy_employee_id)
);

CREATE TABLE public.clockfy_shift_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_event_id UUID REFERENCES public.clockfy_time_events(id),
  shift_record_id UUID REFERENCES public.shift_records(id),
  operator_id UUID REFERENCES public.operators(id),
  assignment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly reports tables
CREATE TABLE public.report_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.report_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.recipient_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES public.report_recipients(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.report_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recipient_id, group_id)
);

CREATE TABLE public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  report_data JSONB,
  generated_by UUID REFERENCES auth.users(id),
  sent_to JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Warehouse tables
CREATE TABLE public.warehouse_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Main Warehouse',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_aisles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layout_id UUID REFERENCES public.warehouse_layouts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_bays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aisle_id UUID REFERENCES public.warehouse_aisles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bay_id UUID REFERENCES public.warehouse_bays(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT,
  max_weight_kg DECIMAL(10,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID REFERENCES public.warehouse_levels(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  location_type TEXT DEFAULT 'storage',
  max_weight_kg DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  weight_per_unit_kg DECIMAL(10,4),
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_slot_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.warehouse_products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  slot_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(location_id, product_id)
);

CREATE TABLE public.warehouse_stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.warehouse_products(id),
  from_location_id UUID REFERENCES public.warehouse_locations(id),
  to_location_id UUID REFERENCES public.warehouse_locations(id),
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milwaukee_test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_shift_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printed_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_printing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pallet_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.box_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pallet_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oee_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_time_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_employee_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_aisles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_bays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_slot_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can do everything
CREATE POLICY "auth_select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.operators FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.operators FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.raw_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.raw_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.stock_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.milwaukee_test_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.milwaukee_test_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.goods_received FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.goods_received FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.goods_out FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.goods_out FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.calibration_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.calibration_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.customer_pos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.customer_pos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.shift_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.shift_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.archive_shift_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.archive_shift_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.printed_labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.printed_labels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.label_printing_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.label_printing_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.printer_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.printer_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.pallets FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.pallets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.pallet_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.pallet_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.box_number_sequences FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.box_number_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.pallet_number_sequences FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.pallet_number_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.product_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.product_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.product_specifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.product_specifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.raw_material_specifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.raw_material_specifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.oee_daily_summary FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.oee_daily_summary FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.timesheet_tracking FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.timesheet_tracking FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_time_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_time_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_sync_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_sync_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_employee_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_employee_mapping FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.clockfy_shift_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.clockfy_shift_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.report_recipients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.report_recipients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.report_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.report_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.recipient_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.recipient_group_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.weekly_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.weekly_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.warehouse_layouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.warehouse_layouts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.warehouse_aisles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.warehouse_aisles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.warehouse_bays FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.warehouse_bays FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.warehouse_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.warehouse_levels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.warehouse_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.warehouse_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.warehouse_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.warehouse_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.warehouse_slot_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.warehouse_slot_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select" ON public.warehouse_stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON public.warehouse_stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Key database functions
CREATE OR REPLACE FUNCTION public.generate_next_box_number(p_sku TEXT, p_po TEXT)
RETURNS INTEGER AS $$
DECLARE next_num INTEGER;
BEGIN
  INSERT INTO public.box_number_sequences (sku, po, last_box_number)
  VALUES (p_sku, p_po, 1)
  ON CONFLICT (sku, po) DO UPDATE SET last_box_number = box_number_sequences.last_box_number + 1, updated_at = now()
  RETURNING last_box_number INTO next_num;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_next_pallet_number(p_prefix TEXT DEFAULT 'PLT')
RETURNS TEXT AS $$
DECLARE next_num INTEGER; result TEXT;
BEGIN
  INSERT INTO public.pallet_number_sequences (prefix, last_number)
  VALUES (p_prefix, 1)
  ON CONFLICT (id) DO UPDATE SET last_number = pallet_number_sequences.last_number + 1, updated_at = now()
  RETURNING last_number INTO next_num;
  result := p_prefix || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.delete_printed_labels_by_date(target_date DATE)
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM public.printed_labels WHERE date_printed::date = target_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_pallets_by_numbers(pallet_numbers TEXT[])
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM public.pallet_assignments WHERE pallet_id IN (SELECT id FROM public.pallets WHERE pallet_number = ANY(pallet_numbers));
  DELETE FROM public.pallets WHERE pallet_number = ANY(pallet_numbers);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_stock_levels()
RETURNS TABLE(sku TEXT, total_in BIGINT, total_out BIGINT, net_stock BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(gi.sku, go.sku) as sku,
    COALESCE(gi.total_in, 0) as total_in,
    COALESCE(go.total_out, 0) as total_out,
    COALESCE(gi.total_in, 0) - COALESCE(go.total_out, 0) as net_stock
  FROM
    (SELECT g.sku, COUNT(*)::BIGINT as total_in FROM public.goods_received g WHERE g.sku IS NOT NULL GROUP BY g.sku) gi
  FULL OUTER JOIN
    (SELECT o.sku, SUM(o.quantity)::BIGINT as total_out FROM public.goods_out o WHERE o.sku IS NOT NULL GROUP BY o.sku) go
  ON gi.sku = go.sku;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_po_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customer_pos
  SET produced_quantity = (
    SELECT COALESCE(SUM(boxes_produced), 0)
    FROM public.shift_records
    WHERE sku = customer_pos.sku AND shift_date >= customer_pos.po_date
  ),
  progress = CASE
    WHEN order_quantity > 0 THEN LEAST(100, (
      SELECT COALESCE(SUM(boxes_produced), 0)::DECIMAL / order_quantity * 100
      FROM public.shift_records
      WHERE sku = customer_pos.sku AND shift_date >= customer_pos.po_date
    ))
    ELSE 0
  END,
  updated_at = now()
  WHERE sku = NEW.sku;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_timesheet_tracking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.timesheet_tracking (operator_id, operator_name, week_number, year, actual_shifts, missing_shifts, compliance_rate, status, last_updated)
  SELECT
    NEW.operator_id,
    NEW.operator_name,
    NEW.week_number,
    NEW.year,
    COUNT(*)::INTEGER,
    GREATEST(0, 5 - COUNT(*)::INTEGER),
    LEAST(100, COUNT(*)::DECIMAL / 5 * 100),
    CASE WHEN COUNT(*) >= 5 THEN 'complete' ELSE 'incomplete' END,
    now()
  FROM public.shift_records
  WHERE operator_id = NEW.operator_id AND week_number = NEW.week_number AND year = NEW.year
  ON CONFLICT (operator_id, week_number, year) DO UPDATE SET
    actual_shifts = EXCLUDED.actual_shifts,
    missing_shifts = EXCLUDED.missing_shifts,
    compliance_rate = EXCLUDED.compliance_rate,
    status = EXCLUDED.status,
    last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.fix_missing_hours()
RETURNS INTEGER AS $$
DECLARE fixed_count INTEGER := 0;
BEGIN
  UPDATE public.shift_records
  SET total_hours = CASE
    WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
    ELSE total_hours
  END
  WHERE (total_hours IS NULL OR total_hours = 0) AND start_time IS NOT NULL AND end_time IS NOT NULL;
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_data_quality_metrics()
RETURNS TABLE(
  total_records BIGINT,
  records_with_hours BIGINT,
  records_without_hours BIGINT,
  records_with_sku BIGINT,
  records_without_sku BIGINT,
  avg_hours DECIMAL,
  data_completeness DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(CASE WHEN total_hours IS NOT NULL AND total_hours > 0 THEN 1 END)::BIGINT,
    COUNT(CASE WHEN total_hours IS NULL OR total_hours = 0 THEN 1 END)::BIGINT,
    COUNT(CASE WHEN sku IS NOT NULL AND sku != '' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN sku IS NULL OR sku = '' THEN 1 END)::BIGINT,
    ROUND(AVG(CASE WHEN total_hours > 0 THEN total_hours END), 2),
    ROUND(COUNT(CASE WHEN total_hours > 0 AND sku IS NOT NULL AND sku != '' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 1)
  FROM public.shift_records;
END;
$$ LANGUAGE plpgsql;

-- Views
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT
  sr.shift_date,
  sr.week_number,
  sr.year,
  sr.operator_name,
  sr.machine_name,
  sr.product_code as sku,
  sr.boxes_produced,
  sr.total_hours,
  sr.shift_type,
  sr.downtime_minutes,
  sr.setup_time_minutes
FROM public.shift_records sr;

CREATE OR REPLACE VIEW public.goods_movements AS
SELECT
  'in' as direction,
  gr.id,
  gr.sku,
  1 as quantity,
  gr.supplier as counterparty,
  NULL as po_number,
  gr.received_date as movement_date,
  gr.notes,
  gr.created_at
FROM public.goods_received gr
WHERE gr.sku IS NOT NULL
UNION ALL
SELECT
  'out' as direction,
  go2.id,
  go2.sku,
  go2.quantity,
  go2.customer as counterparty,
  go2.po_number,
  go2.dispatch_date as movement_date,
  go2.notes,
  go2.created_at
FROM public.goods_out go2
WHERE go2.sku IS NOT NULL;
