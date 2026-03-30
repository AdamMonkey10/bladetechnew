-- Fix Rob's July 11, 2025 timesheet - Update to new structure with 12 hours per laser
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
WHERE shift_date = '2025-07-11' 
  AND shift_type = 'Days'
  AND production_data->>'pieces_produced' = '13500';