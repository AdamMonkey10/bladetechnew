-- Clean up operators table and add the provided operators
DELETE FROM public.operators;

INSERT INTO public.operators (operator_code, operator_name, active) VALUES 
  ('CW', 'Craig', true),
  ('JC', 'Jordan', true), 
  ('LC', 'Lee', true),
  ('MH', 'Matt', true),
  ('RY', 'Rob', true);