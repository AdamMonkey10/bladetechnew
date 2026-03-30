
-- Update Laser 1, 2, 3 with Keyence TMX 1200 details
UPDATE public.equipment SET manufacturer = 'Keyence', model = 'TMX 1200' WHERE id IN ('9a2d560d-a3cb-449b-a764-aff481c13f6f', '1e70736b-905f-4b24-90d6-acc21eb4c059', '03b6e559-f8a4-48bd-a950-4b7a10938f92');

-- Delete standalone Keyence TMX 1200
DELETE FROM public.equipment WHERE id = '0a0903cb-0e57-4a8e-adaa-a148a2c0475a';

-- Insert Laser 4 as Inspection type with Keyence TMX 1200
INSERT INTO public.equipment (equipment_name, equipment_type, manufacturer, model, status, created_by)
VALUES ('Laser 4', 'Inspection', 'Keyence', 'TMX 1200', 'active', 'f0dd890c-85c4-4d12-8f77-4f8913a469a8');
