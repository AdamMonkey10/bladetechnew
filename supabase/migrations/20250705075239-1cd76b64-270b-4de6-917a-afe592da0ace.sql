-- Add missing fields to goods_received table for full legacy functionality
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS pallet_number INTEGER;
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS invoice TEXT;
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS height DECIMAL(8,2);
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS gauge DECIMAL(8,2);
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS set_left_1 DECIMAL(8,2);
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS set_left_2 DECIMAL(8,2);
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS set_right_1 DECIMAL(8,2);
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS set_right_2 DECIMAL(8,2);
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS set_left_avg DECIMAL(8,2);
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS set_right_avg DECIMAL(8,2);
ALTER TABLE public.goods_received ADD COLUMN IF NOT EXISTS good_status BOOLEAN DEFAULT true;

-- Create suppliers table for supplier management
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create specifications table for product specifications
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  height_min DECIMAL(8,2),
  height_max DECIMAL(8,2),
  gauge_min DECIMAL(8,2),
  gauge_max DECIMAL(8,2),
  set_left_min DECIMAL(8,2),
  set_left_max DECIMAL(8,2),
  set_right_min DECIMAL(8,2),
  set_right_max DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_code)
);

-- Enable RLS on new tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Public can view all suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for product specifications
CREATE POLICY "Public can view all specifications" ON public.product_specifications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage specifications" ON public.product_specifications FOR ALL USING (auth.role() = 'authenticated');

-- Add triggers for timestamp updates
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_specifications_updated_at BEFORE UPDATE ON public.product_specifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample suppliers (migrated from legacy data)
INSERT INTO public.suppliers (name) VALUES 
  ('Supplier A'),
  ('Supplier B'),
  ('Supplier C')
ON CONFLICT DO NOTHING;

-- Insert some sample specifications for common products
INSERT INTO public.product_specifications (product_code, height_min, height_max, gauge_min, gauge_max, set_left_min, set_left_max, set_right_min, set_right_max) VALUES 
  ('PROD001', 10.0, 15.0, 2.0, 3.0, 5.0, 10.0, 5.0, 10.0),
  ('PROD002', 8.0, 12.0, 1.5, 2.5, 3.0, 8.0, 3.0, 8.0)
ON CONFLICT (product_code) DO NOTHING;