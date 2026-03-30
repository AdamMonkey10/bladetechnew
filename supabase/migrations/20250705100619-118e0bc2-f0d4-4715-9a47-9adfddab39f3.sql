-- Create raw_materials table for incoming materials
CREATE TABLE public.raw_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create raw_material_specifications table
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

-- Enable RLS for raw_materials
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for raw_materials
CREATE POLICY "Public can view all raw materials" 
ON public.raw_materials 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage raw materials" 
ON public.raw_materials 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Enable RLS for raw_material_specifications
ALTER TABLE public.raw_material_specifications ENABLE ROW LEVEL SECURITY;

-- Create policies for raw_material_specifications
CREATE POLICY "Public can view all raw material specifications" 
ON public.raw_material_specifications 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage raw material specifications" 
ON public.raw_material_specifications 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Add triggers for updated_at
CREATE TRIGGER update_raw_materials_updated_at
BEFORE UPDATE ON public.raw_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_raw_material_specifications_updated_at
BEFORE UPDATE ON public.raw_material_specifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update goods_received table to reference raw_materials
ALTER TABLE public.goods_received DROP CONSTRAINT IF EXISTS goods_received_stock_item_id_fkey;
ALTER TABLE public.goods_received RENAME COLUMN stock_item_id TO raw_material_id;
ALTER TABLE public.goods_received ADD CONSTRAINT goods_received_raw_material_id_fkey 
FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id);

-- Migrate HCS025X239A from products to raw_materials
INSERT INTO public.raw_materials (material_code, material_name, description)
SELECT product_code, product_name, description 
FROM public.products 
WHERE product_code = 'HCS025X239A';

-- Migrate specifications
INSERT INTO public.raw_material_specifications (material_code, height_min, height_max, gauge_min, gauge_max, set_left_min, set_left_max, set_right_min, set_right_max)
SELECT ps.product_code, ps.height_min, ps.height_max, ps.gauge_min, ps.gauge_max, ps.set_left_min, ps.set_left_max, ps.set_right_min, ps.set_right_max
FROM public.product_specifications ps
JOIN public.products p ON ps.product_code = p.product_code
WHERE p.product_code = 'HCS025X239A';

-- Remove HCS025X239A from products and product_specifications
DELETE FROM public.product_specifications WHERE product_code = 'HCS025X239A';
DELETE FROM public.products WHERE product_code = 'HCS025X239A';