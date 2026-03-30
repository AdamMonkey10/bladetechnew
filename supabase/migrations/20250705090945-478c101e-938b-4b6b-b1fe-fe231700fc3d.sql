-- Add the raw material HCS025X239A to products table
INSERT INTO public.products (product_code, product_name, description) VALUES 
  ('HCS025X239A', 'HCS025X239A', '0.025"X2.39" HCS COIL')
ON CONFLICT (product_code) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  description = EXCLUDED.description;

-- Insert specifications for HCS025X239A from Firestore Raw Material data
INSERT INTO public.product_specifications (
  product_code, 
  height_min, height_max,
  gauge_min, gauge_max,
  set_left_min, set_left_max,
  set_right_min, set_right_max
) VALUES (
  'HCS025X239A',
  2.377, 2.387,  -- height min/max
  0.024, 0.026,  -- gauge min/max  
  0.004, 0.01,   -- setLeft min/max
  0.004, 0.01    -- setRight min/max
) ON CONFLICT (product_code) DO UPDATE SET
  height_min = EXCLUDED.height_min,
  height_max = EXCLUDED.height_max,
  gauge_min = EXCLUDED.gauge_min,
  gauge_max = EXCLUDED.gauge_max,
  set_left_min = EXCLUDED.set_left_min,
  set_left_max = EXCLUDED.set_left_max,
  set_right_min = EXCLUDED.set_right_min,
  set_right_max = EXCLUDED.set_right_max;