-- Standardize Rob's timesheets to 12 hours per laser for July 10, 14, and 15, 2025

-- Update July 15, 2025 - Day Shift: Change from 6 hours each to 12 hours each
UPDATE public.shift_records 
SET production_data = jsonb_build_object(
    'activities', jsonb_build_object(
        'Laser1', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 7200,
                'time_spent', 12,
                'scrap', 100,
                'invoice', 'SG-G-PU000384',
                'sku', 'UK32BM001'
            )
        ),
        'Laser2', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 6900,
                'time_spent', 12,
                'scrap', 90,
                'invoice', 'SG-G-PU000384',
                'sku', 'UK32BM001'
            )
        )
    ),
    'pieces_produced', 14100,
    'hours_worked', 24,
    'hours_booked', 24,
    'time_balance_difference', 0
)
WHERE id = '0c3e8fb4-d344-4a0a-92e1-7704db741237';

-- Update July 14, 2025 - Night Shift: Change from 6 hours and 5.8 hours to 12 hours each
UPDATE public.shift_records 
SET production_data = jsonb_build_object(
    'activities', jsonb_build_object(
        'Laser1', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 6300,
                'time_spent', 12,
                'scrap', 100,
                'invoice', 'SG-G-PU000384',
                'sku', 'UK32BM001'
            )
        ),
        'Laser2', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 4500,
                'time_spent', 12,
                'scrap', 110,
                'invoice', 'SG-G-PU000384',
                'sku', 'UK32BM001'
            )
        )
    ),
    'pieces_produced', 10800,
    'hours_worked', 24,
    'hours_booked', 24,
    'time_balance_difference', 0
)
WHERE id = '9021baee-6ea4-4a41-8fb2-7e8e48b5c15e';

-- Update July 10, 2025 - Day Shift: Change Laser2 from 1 hour to 12 hours, consolidate entries
UPDATE public.shift_records 
SET production_data = jsonb_build_object(
    'activities', jsonb_build_object(
        'Laser1', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 5400,
                'time_spent', 12,
                'scrap', 100,
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
    'pieces_produced', 12600,
    'hours_worked', 24,
    'hours_booked', 24,
    'time_balance_difference', 0
)
WHERE id = '0d0a6c6e-2c04-4f26-8894-ce1521a77492';