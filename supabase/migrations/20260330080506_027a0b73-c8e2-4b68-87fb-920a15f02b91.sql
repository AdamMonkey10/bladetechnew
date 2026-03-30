
-- Add missing columns to goods_received
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS warehouse_status text DEFAULT 'pending';
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS warehouse_quantity_moved integer DEFAULT 0;

-- Add missing columns to timesheet_tracking
ALTER TABLE public.timesheet_tracking ADD COLUMN IF NOT EXISTS timesheet_submitted boolean DEFAULT false;
ALTER TABLE public.timesheet_tracking ADD COLUMN IF NOT EXISTS timesheet_submitted_at timestamptz;
ALTER TABLE public.timesheet_tracking ADD COLUMN IF NOT EXISTS days_overdue integer DEFAULT 0;
ALTER TABLE public.timesheet_tracking ADD COLUMN IF NOT EXISTS escalation_level text DEFAULT 'none';

-- Add missing columns to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS template_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS logo_position jsonb DEFAULT '{"x":0,"y":0,"width":100,"height":100}';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS zpl_code text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Populate customer_name from name for existing records
UPDATE public.customers SET customer_name = name WHERE customer_name IS NULL;
