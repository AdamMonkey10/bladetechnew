-- Map Jordan Cook to Jordan (JC) operator
UPDATE clockfy_employees 
SET mapped_operator_id = '060d7587-a914-4d9c-95ec-0e8da77321fd'
WHERE name = 'Jordan Cook';

-- Update existing time events to link to Jordan's operator
UPDATE clockfy_time_events 
SET operator_id = '060d7587-a914-4d9c-95ec-0e8da77321fd'
WHERE employee_id = (
  SELECT id FROM clockfy_employees WHERE name = 'Jordan Cook'
) AND operator_id IS NULL;

-- Verify the mapping
SELECT 
  ce.name as employee_name,
  ce.clockfy_employee_id,
  o.operator_name,
  o.operator_code
FROM clockfy_employees ce
LEFT JOIN operators o ON ce.mapped_operator_id = o.id
WHERE ce.name = 'Jordan Cook';