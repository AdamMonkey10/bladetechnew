-- Import real Firebase calibration data
-- Convert Firebase timestamps and structure to match our schema

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
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Desk Set Checker', 'DSC1', '2024-10-29', '2025-04-29', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Desk Set Checker', 'DSC1', '2024-11-20', '2025-05-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Desk Set Checker', 'DSC1', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Desk Set Checker', 'DSC1', '2025-01-31', '2025-07-31', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

-- Linear Vernier (EG178) records  
('Linear Vernier', 'EG178', '2024-06-17', '2024-12-17', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "", "level05": "0.501", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "0", "level025": "", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 3", "level0": "0", "level025": "", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Linear Vernier', 'EG178', '2024-11-20', '2025-05-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Linear Vernier', 'EG178', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Linear Vernier', 'EG178', '2025-01-31', '2025-07-31', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Linear Vernier', 'EG178', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Linear Vernier', 'EG178', '2024-11-20', '2025-05-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "3", "level05": "6", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

-- Micrometer (M595) records
('Micrometer', 'M595', '2025-01-31', '2025-07-31', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Micrometer', 'M595', '2024-06-17', '2024-12-17', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.7505", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Micrometer', 'M595', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

-- Set Checker (20A-906) records
('Set Checker', '20A-906', '2025-01-31', '2025-07-31', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Set Checker', '20A-906', '2025-01-20', '2025-07-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "0.5", "level075": "0.75", "level1": "1", "level2": "2", "level3": "3", "level6": "6"},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Set Checker', '20A-906', '2024-11-20', '2025-05-20', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "", "level025": "", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8'),

('Set Checker', '20A-906', '2024-06-17', '2024-12-17', 'active', 'Performed by Matt', '[
  {"test": "Test 1", "level0": "0", "level025": "0.25", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 2", "level0": "0", "level025": "0.25", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""},
  {"test": "Test 3", "level0": "0", "level025": "0.25", "level05": "", "level075": "", "level1": "", "level2": "", "level3": "", "level6": ""}
]'::jsonb, 'f0dd890c-85c4-4d12-8f77-4f89913a469a8');