-- Delete the duplicate entries that only have time data but no meaningful production
DELETE FROM public.shift_records 
WHERE id IN ('c00d7f62-2742-400a-adc9-5d9bfcf953d2', '944e0e9a-eee5-42a2-ab0a-6c97dd258c6c');

-- Update the main entry to include proper time allocation for each laser
UPDATE public.shift_records 
SET production_data = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                production_data,
                '{activities,0,entries,0,time_spent}', 
                '11.5'
            ),
            '{activities,1,entries,0,time_spent}', 
            '11.5'
        ),
        '{activities,2,entries,0,time_spent}', 
        '11.5'
    ),
    '{hours_booked}', 
    '34.5'
)
WHERE id = '76cabcb7-7cd8-452a-9206-56a92b7746d4';