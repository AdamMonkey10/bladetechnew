-- Add missing fields to products table
ALTER TABLE public.products 
ADD COLUMN revision TEXT DEFAULT '1.0',
ADD COLUMN packing_instructions TEXT;

-- Add missing fields to raw_materials table  
ALTER TABLE public.raw_materials
ADD COLUMN revision TEXT DEFAULT '1.0',
ADD COLUMN specification_date DATE DEFAULT CURRENT_DATE;

-- Add target columns to product_specifications table
ALTER TABLE public.product_specifications
ADD COLUMN height_target NUMERIC,
ADD COLUMN blade_width_target NUMERIC,
ADD COLUMN blade_body_target NUMERIC,
ADD COLUMN blade_bottom_target NUMERIC,
ADD COLUMN gauge_target NUMERIC,
ADD COLUMN set_left_target NUMERIC,
ADD COLUMN set_right_target NUMERIC,
ADD COLUMN dross_target NUMERIC,
ADD COLUMN flatness_target NUMERIC,
ADD COLUMN tooth_set_min NUMERIC,
ADD COLUMN tooth_set_max NUMERIC,
ADD COLUMN tooth_set_target NUMERIC;

-- Add target columns to raw_material_specifications table
ALTER TABLE public.raw_material_specifications
ADD COLUMN height_target NUMERIC,
ADD COLUMN gauge_target NUMERIC,
ADD COLUMN set_left_target NUMERIC,
ADD COLUMN set_right_target NUMERIC;

-- Create indexes for better performance
CREATE INDEX idx_products_revision ON public.products(product_code, revision);
CREATE INDEX idx_raw_materials_revision ON public.raw_materials(material_code, revision);
CREATE INDEX idx_raw_materials_spec_date ON public.raw_materials(specification_date);