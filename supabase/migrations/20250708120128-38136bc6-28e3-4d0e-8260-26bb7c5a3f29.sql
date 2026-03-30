-- Update test employee name to match Clockfy data
UPDATE public.clockfy_employees 
SET name = 'Mathew Hall', email = 'mathew.hall@company.com' 
WHERE clockfy_employee_id = 'emp_matt_001';