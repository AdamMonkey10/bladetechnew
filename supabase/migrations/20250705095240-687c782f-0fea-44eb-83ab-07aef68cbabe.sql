-- Clean up machines table and add Laser machines for Milwaukee Test
DELETE FROM public.machines;

INSERT INTO public.machines (machine_code, machine_name, machine_type, active) VALUES 
  ('LASER01', 'Laser 1', 'Testing Machine', true),
  ('LASER02', 'Laser 2', 'Testing Machine', true),
  ('LASER03', 'Laser 3', 'Testing Machine', true);