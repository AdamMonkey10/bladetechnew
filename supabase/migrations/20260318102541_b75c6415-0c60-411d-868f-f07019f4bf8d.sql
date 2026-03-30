UPDATE public.equipment
SET equipment_name = 'GT2-CH2M'
WHERE equipment_name = 'Probe'
  AND manufacturer = 'Keyence';

UPDATE public.calibration_records
SET equipment_name = 'GT2-CH2M'
WHERE equipment_name = 'Probe';