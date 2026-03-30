-- Archive shift records from July 6th, 2025 and earlier
-- Insert records where shift_date <= '2025-07-06' into archive table
INSERT INTO public.archive_shift_records (
    id, created_at, end_time, start_time, user_id, notes, 
    shift_type, production_data, shift_date, machine_id, operator_id
)
SELECT 
    id, created_at, end_time, start_time, user_id, notes,
    shift_type, production_data, shift_date, machine_id, operator_id
FROM public.shift_records 
WHERE shift_date <= '2025-07-06';

-- Delete archived records from active table
DELETE FROM public.shift_records 
WHERE shift_date <= '2025-07-06';