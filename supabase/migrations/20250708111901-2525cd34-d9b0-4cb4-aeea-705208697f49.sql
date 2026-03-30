-- Create test data for Matt being clocked in
-- First, create a Clockfy employee record for Matt
INSERT INTO public.clockfy_employees (
  clockfy_employee_id,
  name,
  email,
  is_active,
  mapped_operator_id
) VALUES (
  'emp_matt_001',
  'Matt',
  'matt@company.com',
  true,
  'd1aeefb1-ee34-4aa8-a5e4-ad17eb1637dd'
);

-- Create a clock-in record for Matt (clocked in but not out)
INSERT INTO public.clockfy_time_events (
  clockfy_record_id,
  employee_id,
  operator_id,
  clock_in,
  clock_out,
  total_hours
) VALUES (
  'rec_matt_today_001',
  (SELECT id FROM public.clockfy_employees WHERE name = 'Matt'),
  'd1aeefb1-ee34-4aa8-a5e4-ad17eb1637dd',
  CURRENT_TIMESTAMP - INTERVAL '3 hours',
  NULL,
  NULL
);