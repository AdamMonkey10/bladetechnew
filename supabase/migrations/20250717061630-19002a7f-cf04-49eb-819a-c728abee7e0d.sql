-- Map Lee Gwynne to Lee (LG) operator
UPDATE clockfy_employees 
SET mapped_operator_id = '35cd13af-9f3b-4a33-b498-4b9b778f02d3'
WHERE name = 'Lee Gwynne';

-- Update existing time events to link to Lee's operator
UPDATE clockfy_time_events 
SET operator_id = '35cd13af-9f3b-4a33-b498-4b9b778f02d3'
WHERE employee_id = (
  SELECT id FROM clockfy_employees WHERE name = 'Lee Gwynne'
) AND operator_id IS NULL;