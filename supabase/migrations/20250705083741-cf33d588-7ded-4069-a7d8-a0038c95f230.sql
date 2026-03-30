-- Clear existing generic products
DELETE FROM public.products WHERE product_name = 'Unknown Product';
DELETE FROM public.product_specifications WHERE product_code LIKE 'PROD%';

-- Insert the actual products from Firestore data
INSERT INTO public.products (product_code, product_name, description) VALUES 
  ('CPPL200.1', 'CPPL200.1 Blade', 'Blade product with specifications'),
  ('CPPL360', 'CPPL360', 'Product CPPL360'),
  ('UK32BM001', 'UK32BM001', 'UK product 32BM001'),
  ('UK32RW001', 'UK32RW001', 'UK product 32RW001'),
  ('UK44BM001', 'UK44BM001', 'UK product 44BM001'),
  ('UK63RW001', 'UK63RW001', 'UK product 63RW001')
ON CONFLICT (product_code) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  description = EXCLUDED.description;

-- Insert specifications for CPPL200.1 (the one with detailed specs)
INSERT INTO public.product_specifications (
  product_code, 
  height_min, height_max,
  gauge_min, gauge_max,
  set_left_min, set_left_max,
  set_right_min, set_right_max
) VALUES (
  'CPPL200.1',
  2.377, 2.387,  -- height min/max
  0.024, 0.026,  -- gauge min/max  
  0.004, 0.01,   -- toothSet as set_left min/max
  0.825, 0.835   -- bladeBody as set_right min/max
) ON CONFLICT (product_code) DO UPDATE SET
  height_min = EXCLUDED.height_min,
  height_max = EXCLUDED.height_max,
  gauge_min = EXCLUDED.gauge_min,
  gauge_max = EXCLUDED.gauge_max,
  set_left_min = EXCLUDED.set_left_min,
  set_left_max = EXCLUDED.set_left_max,
  set_right_min = EXCLUDED.set_right_min,
  set_right_max = EXCLUDED.set_right_max;