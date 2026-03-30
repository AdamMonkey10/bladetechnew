UPDATE public.calibration_records
SET
  calibration_date = '2026-01-12',
  next_calibration_date = '2026-07-13'
WHERE equipment_name = 'Laser 4'
  AND calibration_date = '2025-06-09';