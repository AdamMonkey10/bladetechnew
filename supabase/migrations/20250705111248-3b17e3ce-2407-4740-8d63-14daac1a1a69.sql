-- Fix precision issue: Change NUMERIC(8,2) columns to NUMERIC for imperial measurements
ALTER TABLE public.product_specifications 
ALTER COLUMN height_min TYPE NUMERIC,
ALTER COLUMN height_max TYPE NUMERIC,
ALTER COLUMN gauge_min TYPE NUMERIC,
ALTER COLUMN gauge_max TYPE NUMERIC,
ALTER COLUMN blade_width_min TYPE NUMERIC,
ALTER COLUMN blade_width_max TYPE NUMERIC,
ALTER COLUMN blade_body_min TYPE NUMERIC,
ALTER COLUMN blade_body_max TYPE NUMERIC,
ALTER COLUMN blade_bottom_min TYPE NUMERIC,
ALTER COLUMN blade_bottom_max TYPE NUMERIC,
ALTER COLUMN set_left_min TYPE NUMERIC,
ALTER COLUMN set_left_max TYPE NUMERIC,
ALTER COLUMN set_right_min TYPE NUMERIC,
ALTER COLUMN set_right_max TYPE NUMERIC,
ALTER COLUMN dross_min TYPE NUMERIC,
ALTER COLUMN dross_max TYPE NUMERIC,
ALTER COLUMN flatness_min TYPE NUMERIC,
ALTER COLUMN flatness_max TYPE NUMERIC;

-- Insert CPPL200.1 specifications with proper imperial precision
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
  2.3770, 2.3870,    -- height (4 decimal places)
  0.0240, 0.0260,    -- gauge (4 decimal places)
  1.3690, 1.3790,    -- blade_width (4 decimal places)
  0.8250, 0.8350,    -- blade_body (4 decimal places)
  1.1950, 1.2050,    -- blade_bottom (4 decimal places)
  0.0040, 0.0100,    -- set_left (4 decimal places)
  0.0040, 0.0100,    -- set_right (4 decimal places)
  0.0000, 0.0025,    -- dross (4 decimal places)
  0.0000, 0.0025     -- flatness (4 decimal places)
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