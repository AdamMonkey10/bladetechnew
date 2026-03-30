-- Create core tables for BladeTech quality control system

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Operators table  
CREATE TABLE public.operators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_name TEXT NOT NULL,
  operator_code TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Machines table
CREATE TABLE public.machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_name TEXT NOT NULL,
  machine_code TEXT UNIQUE NOT NULL,
  machine_type TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Milwaukee test reports table
CREATE TABLE public.milwaukee_test_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  operator_id UUID REFERENCES public.operators(id),
  machine_id UUID REFERENCES public.machines(id),
  test_date DATE NOT NULL,
  shift TEXT,
  total_saws INTEGER,
  total_defects INTEGER,
  defect_rate DECIMAL(5,2),
  test_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock/Inventory table
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

-- Goods in/receiving table
CREATE TABLE public.goods_received (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_item_id UUID REFERENCES public.stock_items(id),
  quantity_received INTEGER NOT NULL,
  received_date DATE NOT NULL,
  supplier TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calibration records table
CREATE TABLE public.calibration_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  equipment_serial TEXT,
  calibration_date DATE NOT NULL,
  next_calibration_date DATE,
  calibration_data JSONB,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer PO table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shift records table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milwaukee_test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read, authenticated write)
CREATE POLICY "Public can view all products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view all operators" ON public.operators FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage operators" ON public.operators FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view all machines" ON public.machines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage machines" ON public.machines FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view all stock items" ON public.stock_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage stock" ON public.stock_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all test reports" ON public.milwaukee_test_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create test reports" ON public.milwaukee_test_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their test reports" ON public.milwaukee_test_reports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all goods received" ON public.goods_received FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create goods received" ON public.goods_received FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their goods received" ON public.goods_received FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all calibration records" ON public.calibration_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create calibration records" ON public.calibration_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their calibration records" ON public.calibration_records FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all customer POs" ON public.customer_pos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create customer POs" ON public.customer_pos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their customer POs" ON public.customer_pos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all shift records" ON public.shift_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create shift records" ON public.shift_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their shift records" ON public.shift_records FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON public.operators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON public.machines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_milwaukee_test_reports_updated_at BEFORE UPDATE ON public.milwaukee_test_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calibration_records_updated_at BEFORE UPDATE ON public.calibration_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customer_pos_updated_at BEFORE UPDATE ON public.customer_pos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();