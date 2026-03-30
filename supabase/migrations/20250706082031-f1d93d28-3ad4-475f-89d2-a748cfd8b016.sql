-- Clean up placeholder calibration records
-- Delete all records with "Unknown Equipment" as these are migration artifacts
DELETE FROM public.calibration_records 
WHERE equipment_name = 'Unknown Equipment';