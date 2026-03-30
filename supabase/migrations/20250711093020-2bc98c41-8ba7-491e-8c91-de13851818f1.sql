-- Update existing clockfy_time_events to populate operator_id based on employee mappings

-- Update Craig Walker's time events with his operator_id
UPDATE clockfy_time_events 
SET operator_id = '0d242008-23d4-4229-bd2d-7a411fe041ed'
WHERE employee_id = (
  SELECT id FROM clockfy_employees WHERE name = 'Craig Walker'
) AND operator_id IS NULL;

-- Update Robert Yates' time events with his operator_id  
UPDATE clockfy_time_events 
SET operator_id = '427b457a-ecbf-4907-90ae-94d250c977c9'
WHERE employee_id = (
  SELECT id FROM clockfy_employees WHERE name = 'Robert Yates'
) AND operator_id IS NULL;

-- Verify the updates
SELECT 
  cte.id,
  ce.name as employee_name,
  o.operator_name,
  o.operator_code,
  cte.clock_in,
  cte.clock_out
FROM clockfy_time_events cte
JOIN clockfy_employees ce ON cte.employee_id = ce.id
LEFT JOIN operators o ON cte.operator_id = o.id
WHERE ce.name IN ('Craig Walker', 'Robert Yates')
ORDER BY cte.clock_in DESC;