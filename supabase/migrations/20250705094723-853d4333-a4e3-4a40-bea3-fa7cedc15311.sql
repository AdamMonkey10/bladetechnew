-- Restore finished blade products for Milwaukee Test form
INSERT INTO public.products (product_code, product_name, description) VALUES 
  ('CPPL200.1', 'CPPL200.1 Blade', 'Finished blade product with specifications'),
  ('CPPL360', 'CPPL360 Blade', 'Finished blade product CPPL360'),
  ('UK32BM001', 'UK32BM001 Blade', 'UK finished blade product 32BM001'),
  ('UK32RW001', 'UK32RW001 Blade', 'UK finished blade product 32RW001'),
  ('UK44BM001', 'UK44BM001 Blade', 'UK finished blade product 44BM001'),
  ('UK63RW001', 'UK63RW001 Blade', 'UK finished blade product 63RW001')
ON CONFLICT (product_code) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  description = EXCLUDED.description;

-- Insert specifications for CPPL200.1 (the one with detailed specs from previous migration)
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
  0.004, 0.01,   -- set_left min/max
  0.825, 0.835   -- set_right min/max
) ON CONFLICT (product_code) DO UPDATE SET
  height_min = EXCLUDED.height_min,
  height_max = EXCLUDED.height_max,
  gauge_min = EXCLUDED.gauge_min,
  gauge_max = EXCLUDED.gauge_max,
  set_left_min = EXCLUDED.set_left_min,
  set_left_max = EXCLUDED.set_left_max,
  set_right_min = EXCLUDED.set_right_min,
  set_right_max = EXCLUDED.set_right_max;

-- Add basic specifications for other blade products
INSERT INTO public.product_specifications (
  product_code, 
  height_min, height_max,
  gauge_min, gauge_max,
  set_left_min, set_left_max,
  set_right_min, set_right_max
) VALUES 
  ('CPPL360', 2.0, 2.5, 0.02, 0.03, 0.005, 0.015, 0.8, 0.9),
  ('UK32BM001', 1.8, 2.2, 0.025, 0.035, 0.006, 0.014, 0.75, 0.85),
  ('UK32RW001', 1.9, 2.3, 0.023, 0.033, 0.005, 0.013, 0.78, 0.88),
  ('UK44BM001', 2.1, 2.6, 0.024, 0.034, 0.007, 0.016, 0.82, 0.92),
  ('UK63RW001', 2.2, 2.7, 0.026, 0.036, 0.008, 0.018, 0.85, 0.95)
ON CONFLICT (product_code) DO UPDATE SET
  height_min = EXCLUDED.height_min,
  height_max = EXCLUDED.height_max,
  gauge_min = EXCLUDED.gauge_min,
  gauge_max = EXCLUDED.gauge_max,
  set_left_min = EXCLUDED.set_left_min,
  set_left_max = EXCLUDED.set_left_max,
  set_right_min = EXCLUDED.set_right_min,
  set_right_max = EXCLUDED.set_right_max;