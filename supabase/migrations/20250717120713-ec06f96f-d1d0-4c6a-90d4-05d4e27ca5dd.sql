-- Clean up corrupt future-dated shift records
-- Remove all shift records with dates after today (2025-07-17)
DELETE FROM public.shift_records 
WHERE shift_date > CURRENT_DATE;

-- Also clean up any archive records with future dates
DELETE FROM public.archive_shift_records 
WHERE shift_date > CURRENT_DATE;