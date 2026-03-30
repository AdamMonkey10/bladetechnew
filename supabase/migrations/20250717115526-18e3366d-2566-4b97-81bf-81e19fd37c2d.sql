-- Fix Rob's July 11, 2025 timesheet - Set 12 hours for both lasers
UPDATE public.shift_records 
SET production_data = jsonb_build_object(
    'activities', jsonb_build_object(
        'Laser1', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 6300,
                'time_spent', 12,
                'scrap', 60,
                'invoice', 'SG-G-PU000384',
                'sku', 'UK32BM001'
            )
        ),
        'Laser2', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 7200,
                'time_spent', 12,
                'invoice', 'SG-G-PU000384',
                'sku', 'UK32BM001'
            )
        )
    ),
    'pieces_produced', 13500,
    'hours_worked', 24,
    'hours_booked', 24,
    'time_balance_difference', 0
)
WHERE operator_id = 'c9d5e3f3-0c42-4a5b-8f8e-9d7c6b5a4e3f' 
  AND shift_date = '2025-07-11' 
  AND shift_type = 'Days';