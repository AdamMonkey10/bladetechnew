-- Create product_materials table for Bill of Materials (BOM) system
CREATE TABLE public.product_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  quantity_required NUMERIC NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, raw_material_id)
);

-- Enable RLS on product_materials
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_materials
CREATE POLICY "Authenticated users can manage product materials" 
ON public.product_materials 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Public can view product materials" 
ON public.product_materials 
FOR SELECT 
USING (true);

-- Add goods_received_id to milwaukee_test_reports for traceability
ALTER TABLE public.milwaukee_test_reports 
ADD COLUMN goods_received_id UUID REFERENCES public.goods_received(id);

-- Create updated_at trigger for product_materials
CREATE TRIGGER update_product_materials_updated_at
BEFORE UPDATE ON public.product_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample BOM relationships (CPPL200.1 uses HCS025X239A)
INSERT INTO public.product_materials (product_id, raw_material_id, quantity_required, notes)
SELECT 
  p.id as product_id,
  rm.id as raw_material_id,
  1 as quantity_required,
  'Primary raw material for production' as notes
FROM public.products p, public.raw_materials rm
WHERE p.product_code = 'CPPL200.1' AND rm.material_code = 'HCS025X239A'
ON CONFLICT (product_id, raw_material_id) DO NOTHING;