UPDATE public.calibration_records
SET equipment_name = 'Inspection'
WHERE equipment_name = 'Laser 4';

UPDATE public.equipment
SET equipment_name = 'Inspection'
WHERE equipment_name = 'Laser 4';