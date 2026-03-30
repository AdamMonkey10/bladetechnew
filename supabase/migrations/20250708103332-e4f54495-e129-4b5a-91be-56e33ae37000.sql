
-- Create Clockfy integration tables

-- Table to store time events (clock-in/out records) from Clockfy
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

-- Table to store employee data from Clockfy
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

-- Table to store shift assignments from Clockfy
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

-- Table to manually map Clockfy employees to Production operators
CREATE TABLE public.clockfy_employee_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clockfy_employee_id UUID REFERENCES public.clockfy_employees(id) NOT NULL,
  operator_id UUID REFERENCES public.operators(id) NOT NULL,
  mapping_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'email', 'name'
  confidence_score NUMERIC DEFAULT 1.0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clockfy_employee_id, operator_id)
);

-- Table to log webhook processing
CREATE TABLE public.clockfy_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'time_record', 'employee', 'shift_assignment'
  clockfy_id UUID NOT NULL,
  payload JSONB NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error'
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clockfy_time_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_employee_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clockfy_sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view Clockfy time events" 
ON public.clockfy_time_events 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage Clockfy time events" 
ON public.clockfy_time_events 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can view Clockfy employees" 
ON public.clockfy_employees 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage Clockfy employees" 
ON public.clockfy_employees 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can view Clockfy shift assignments" 
ON public.clockfy_shift_assignments 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage Clockfy shift assignments" 
ON public.clockfy_shift_assignments 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can view Clockfy employee mapping" 
ON public.clockfy_employee_mapping 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage Clockfy employee mapping" 
ON public.clockfy_employee_mapping 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can view Clockfy sync log" 
ON public.clockfy_sync_log 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage Clockfy sync log" 
ON public.clockfy_sync_log 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Create indexes for performance
CREATE INDEX idx_clockfy_time_events_employee_id ON public.clockfy_time_events(employee_id);
CREATE INDEX idx_clockfy_time_events_operator_id ON public.clockfy_time_events(operator_id);
CREATE INDEX idx_clockfy_time_events_clock_in ON public.clockfy_time_events(clock_in);
CREATE INDEX idx_clockfy_employees_email ON public.clockfy_employees(email);
CREATE INDEX idx_clockfy_employees_name ON public.clockfy_employees(name);
CREATE INDEX idx_clockfy_sync_log_event_type ON public.clockfy_sync_log(event_type);
CREATE INDEX idx_clockfy_sync_log_status ON public.clockfy_sync_log(processing_status);

-- Create trigger for updating timestamps
CREATE TRIGGER update_clockfy_time_events_updated_at
BEFORE UPDATE ON public.clockfy_time_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clockfy_employees_updated_at
BEFORE UPDATE ON public.clockfy_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clockfy_shift_assignments_updated_at
BEFORE UPDATE ON public.clockfy_shift_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clockfy_employee_mapping_updated_at
BEFORE UPDATE ON public.clockfy_employee_mapping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
