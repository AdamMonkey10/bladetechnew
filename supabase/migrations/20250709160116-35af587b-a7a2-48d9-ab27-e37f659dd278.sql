-- Update Matt's Clockfy employee to map to his operator
UPDATE clockfy_employees 
SET 
  mapped_operator_id = 'd1aeefb1-ee34-4aa8-a5e4-ad17eb1637dd',
  name = 'Matt',
  updated_at = now()
WHERE clockfy_employee_id = '58158560-1550-4060-b588-03ce4ade8fab';

-- Update existing time events to link to Matt's operator
UPDATE clockfy_time_events 
SET operator_id = 'd1aeefb1-ee34-4aa8-a5e4-ad17eb1637dd'
WHERE employee_id = '17304b52-371d-4670-b737-0cda7691af0f';

-- Verify the mapping
SELECT 
  ce.name,
  ce.clockfy_employee_id,
  ce.mapped_operator_id,
  o.operator_name
FROM clockfy_employees ce
LEFT JOIN operators o ON ce.mapped_operator_id = o.id
WHERE ce.clockfy_employee_id = '58158560-1550-4060-b588-03ce4ade8fab';