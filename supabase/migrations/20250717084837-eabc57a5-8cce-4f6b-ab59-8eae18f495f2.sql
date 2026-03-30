-- Fix Rob's July 16th Night Shift data - consolidate records and set 12 hours per laser
-- Update record d7679337-8d3f-423d-979d-ec8c137b6671 to include all laser data with 12 hours each
-- Then delete the duplicate record 50eb8575-12e4-4f23-af41-a84cb0e8931f

-- First, update the main record to consolidate all laser activities
UPDATE public.shift_records 
SET production_data = jsonb_build_object(
    'activities', jsonb_build_object(
        'Laser1', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 7200,
                'time_spent', 12,
                'invoice', 'SG-G-PU000384',
                'sku', 'UK32BM001'
            )
        ),
        'Laser2', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 6800,
                'time_spent', 12,
                'invoice', 'SG-G-PU000384',
                'sku', 'UK32BM001'
            )
        ),
        'Laser3', jsonb_build_array(
            jsonb_build_object(
                'units_produced', 3400,
                'time_spent', 12,
                'invoice', 'SG-G-PU000381',
                'sku', 'UK32BM001'
            )
        )
    ),
    'pieces_produced', 17400,
    'hours_worked', 36,
    'hours_booked', 36,
    'time_balance_difference', 0
)
WHERE id = 'd7679337-8d3f-423d-979d-ec8c137b6671';

-- Delete the duplicate/partial record
DELETE FROM public.shift_records 
WHERE id = '50eb8575-12e4-4f23-af41-a84cb0e8931f';