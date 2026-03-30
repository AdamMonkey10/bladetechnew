-- Fix Craig's timesheet data entry error for July 14th, 2025
-- Change 1015 hours to 10.15 hours in his Laser3 activity

UPDATE public.shift_records 
SET production_data = jsonb_set(
    production_data,
    '{activities}',
    (
        SELECT jsonb_agg(
            CASE 
                WHEN activity_item->>'name' = 'Laser3' THEN
                    jsonb_set(
                        activity_item,
                        '{entries}',
                        (
                            SELECT jsonb_agg(
                                CASE 
                                    WHEN entry_item->>'time_spent' = '1015' THEN
                                        jsonb_set(entry_item, '{time_spent}', '10.15')
                                    ELSE entry_item
                                END
                            )
                            FROM jsonb_array_elements(activity_item->'entries') AS entry_item
                        )
                    )
                ELSE activity_item
            END
        )
        FROM jsonb_array_elements(production_data->'activities') AS activity_item
    )
)
WHERE operator_id = (SELECT id FROM public.operators WHERE operator_name = 'Craig')
  AND shift_date = '2025-07-14'
  AND production_data->'activities' @> '[{"name": "Laser3"}]'
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(production_data->'activities') AS activity_item,
         jsonb_array_elements(activity_item->'entries') AS entry_item
    WHERE activity_item->>'name' = 'Laser3' 
      AND entry_item->>'time_spent' = '1015'
  );