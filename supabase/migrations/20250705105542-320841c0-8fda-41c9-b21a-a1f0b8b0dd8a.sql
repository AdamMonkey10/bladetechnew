-- Update CPPL200.1 specifications with correct values
UPDATE public.product_specifications 
SET 
  height_min = 2.377,
  height_max = 2.387,
  gauge_min = 0.024,
  gauge_max = 0.026,
  blade_width_min = 1.369,
  blade_width_max = 1.379,
  blade_body_min = 0.825,
  blade_body_max = 0.835,
  blade_bottom_min = 1.195,
  blade_bottom_max = 1.205,
  set_left_min = 0.004,
  set_left_max = 0.01,
  set_right_min = 0.004,
  set_right_max = 0.01,
  dross_min = 0.0,
  dross_max = 0.0025,
  flatness_min = 0.0,
  flatness_max = 0.0025,
  updated_at = now()
WHERE product_code = 'CPPL200.1';