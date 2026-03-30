-- Insert CPPL200.1 specifications (they don't exist yet, previous UPDATEs failed)
INSERT INTO public.product_specifications (
  product_code,
  height_min, height_max,
  gauge_min, gauge_max,
  blade_width_min, blade_width_max,
  blade_body_min, blade_body_max,
  blade_bottom_min, blade_bottom_max,
  set_left_min, set_left_max,
  set_right_min, set_right_max,
  dross_min, dross_max,
  flatness_min, flatness_max
) VALUES (
  'CPPL200.1',
  2.377, 2.387,  -- height
  0.024, 0.026,  -- gauge
  1.369, 1.379,  -- blade_width
  0.825, 0.835,  -- blade_body
  1.195, 1.205,  -- blade_bottom
  0.004, 0.01,   -- set_left
  0.004, 0.01,   -- set_right
  0.0, 0.0025,   -- dross
  0.0, 0.0025    -- flatness
) ON CONFLICT (product_code) DO UPDATE SET
  height_min = EXCLUDED.height_min,
  height_max = EXCLUDED.height_max,
  gauge_min = EXCLUDED.gauge_min,
  gauge_max = EXCLUDED.gauge_max,
  blade_width_min = EXCLUDED.blade_width_min,
  blade_width_max = EXCLUDED.blade_width_max,
  blade_body_min = EXCLUDED.blade_body_min,
  blade_body_max = EXCLUDED.blade_body_max,
  blade_bottom_min = EXCLUDED.blade_bottom_min,
  blade_bottom_max = EXCLUDED.blade_bottom_max,
  set_left_min = EXCLUDED.set_left_min,
  set_left_max = EXCLUDED.set_left_max,
  set_right_min = EXCLUDED.set_right_min,
  set_right_max = EXCLUDED.set_right_max,
  dross_min = EXCLUDED.dross_min,
  dross_max = EXCLUDED.dross_max,
  flatness_min = EXCLUDED.flatness_min,
  flatness_max = EXCLUDED.flatness_max,
  updated_at = now();