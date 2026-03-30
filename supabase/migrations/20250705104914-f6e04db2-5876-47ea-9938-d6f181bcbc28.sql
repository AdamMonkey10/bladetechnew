-- Update CPPL200.1 specifications with correct values
UPDATE public.product_specifications 
SET 
  height_min = 2.377,
  height_max = 2.387,
  gauge_min = 0.024,
  gauge_max = 0.026,
  set_left_min = 0.004,
  set_left_max = 0.01,
  set_right_min = 0.004,
  set_right_max = 0.01,
  updated_at = now()
WHERE product_code = 'CPPL200.1';