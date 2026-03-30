-- Fix Craig's timesheet data entry errors for July 15-17, 2025
-- These are decimal point errors where values were entered without decimal points

-- July 17th: Fix 945 hours to 9.45 hours in Coating activity
UPDATE public.shift_records 
SET production_data = jsonb_set(
    production_data,
    '{activities}',
    (
        SELECT jsonb_agg(
            CASE 
                WHEN activity_item->>'name' = 'Coating' THEN
                    jsonb_set(
                        activity_item,
                        '{entries}',
                        (
                            SELECT jsonb_agg(
                                CASE 
                                    WHEN entry_item->>'time_spent' = '945' THEN
                                        jsonb_set(entry_item, '{time_spent}', '9.45')
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
  AND shift_date = '2025-07-17'
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(production_data->'activities') AS activity_item,
         jsonb_array_elements(activity_item->'entries') AS entry_item
    WHERE activity_item->>'name' = 'Coating' 
      AND entry_item->>'time_spent' = '945'
  );

-- July 17th: Also fix hours_booked if it's 945
UPDATE public.shift_records 
SET production_data = jsonb_set(
    production_data, 
    '{hours_booked}', 
    '"9.45"'::jsonb
)
WHERE operator_id = (SELECT id FROM public.operators WHERE operator_name = 'Craig')
  AND shift_date = '2025-07-17'
  AND production_data->>'hours_booked' = '945';

-- July 16th: Fix 36 hours entries (likely should be 3.6 hours)
UPDATE public.shift_records 
SET production_data = jsonb_set(
    production_data,
    '{activities}',
    (
        SELECT jsonb_agg(
            CASE 
                WHEN activity_item->>'name' IN ('Laser1', 'Laser2', 'Laser3') THEN
                    jsonb_set(
                        activity_item,
                        '{entries}',
                        (
                            SELECT jsonb_agg(
                                CASE 
                                    WHEN entry_item->>'time_spent' = '36' THEN
                                        jsonb_set(entry_item, '{time_spent}', '3.6')
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
  AND shift_date = '2025-07-16'
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(production_data->'activities') AS activity_item,
         jsonb_array_elements(activity_item->'entries') AS entry_item
    WHERE activity_item->>'name' IN ('Laser1', 'Laser2', 'Laser3')
      AND entry_item->>'time_spent' = '36'
  );

-- July 16th: Fix hours_booked if it's 36
UPDATE public.shift_records 
SET production_data = jsonb_set(
    production_data, 
    '{hours_booked}', 
    '"3.6"'::jsonb
)
WHERE operator_id = (SELECT id FROM public.operators WHERE operator_name = 'Craig')
  AND shift_date = '2025-07-16'
  AND production_data->>'hours_booked' = '36';

-- July 15th: Fix 20 hours entries (likely should be 2.0 hours)
UPDATE public.shift_records 
SET production_data = jsonb_set(
    production_data,
    '{activities}',
    (
        SELECT jsonb_agg(
            CASE 
                WHEN activity_item->>'name' IN ('Laser3', 'Coating') THEN
                    jsonb_set(
                        activity_item,
                        '{entries}',
                        (
                            SELECT jsonb_agg(
                                CASE 
                                    WHEN entry_item->>'time_spent' = '20' THEN
                                        jsonb_set(entry_item, '{time_spent}', '2.0')
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
  AND shift_date = '2025-07-15'
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(production_data->'activities') AS activity_item,
         jsonb_array_elements(activity_item->'entries') AS entry_item
    WHERE activity_item->>'name' IN ('Laser3', 'Coating')
      AND entry_item->>'time_spent' = '20'
  );

-- July 15th: Fix hours_booked if it's 20
UPDATE public.shift_records 
SET production_data = jsonb_set(
    production_data, 
    '{hours_booked}', 
    '"2.0"'::jsonb
)
WHERE operator_id = (SELECT id FROM public.operators WHERE operator_name = 'Craig')
  AND shift_date = '2025-07-15'
  AND production_data->>'hours_booked' = '20';