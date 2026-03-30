-- Map Craig Walker to Craig (CW) operator
UPDATE clockfy_employees 
SET mapped_operator_id = '0d242008-23d4-4229-bd2d-7a411fe041ed'
WHERE name = 'Craig Walker';

-- Map Robert Yates to Rob (RY) operator  
UPDATE clockfy_employees 
SET mapped_operator_id = '427b457a-ecbf-4907-90ae-94d250c977c9'
WHERE name = 'Robert Yates';

-- Verify the mappings
SELECT 
  ce.name as employee_name,
  ce.clockfy_employee_id,
  o.operator_name,
  o.operator_code
FROM clockfy_employees ce
LEFT JOIN operators o ON ce.mapped_operator_id = o.id
WHERE ce.name IN ('Craig Walker', 'Robert Yates')
ORDER BY ce.name;