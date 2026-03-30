-- Step 1: Drop the foreign key constraint that's preventing historical data import
ALTER TABLE public.calibration_records 
DROP CONSTRAINT IF EXISTS calibration_records_user_id_fkey;

-- Step 2: Update RLS policy to allow viewing records with NULL user_id (historical data)
DROP POLICY IF EXISTS "Users can view all calibration records" ON public.calibration_records;
CREATE POLICY "Users can view all calibration records" 
ON public.calibration_records 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Step 3: Import historical calibration data with NULL user_id
INSERT INTO public.calibration_records (
  equipment_name,
  equipment_serial,
  calibration_date,
  next_calibration_date,
  status,
  notes,
  calibration_data,
  user_id
) VALUES
-- Desk Set Checker (DSC1) records
('Desk Set Checker', 'DSC1', '2024-11-20', '2025-05-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.05", "level05": "0.1", "level075": "0.5", "level1": "1", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Desk Set Checker', 'DSC1', '2024-10-29', '2025-04-29', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Desk Set Checker', 'DSC1', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Desk Set Checker', 'DSC1', '2025-01-31', '2025-07-31', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

-- Linear Vernier (EG178) records
('Linear Vernier', 'EG178', '2024-06-17', '2024-12-17', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "", "level05": "0.501", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "0", "level025": "", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 3", "level0": "0", "level025": "", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"}
]'::jsonb, NULL),

('Linear Vernier', 'EG178', '2024-11-20', '2025-05-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Linear Vernier', 'EG178', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Linear Vernier', 'EG178', '2025-01-31', '2025-07-31', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

-- Micrometer (M595) records
('Micrometer', 'M595', '2025-01-31', '2025-07-31', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Micrometer', 'M595', '2024-06-17', '2024-12-17', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.7505", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Micrometer', 'M595', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

-- Set Checker (20A-906) records
('Set Checker', '20A-906', '2025-01-31', '2025-07-31', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Set Checker', '20A-906', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Set Checker', '20A-906', '2024-11-20', '2025-05-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL),

('Set Checker', '20A-906', '2024-06-17', '2024-12-17', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "0", "level025": "0.25", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "0", "level025": "0.25", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, NULL);