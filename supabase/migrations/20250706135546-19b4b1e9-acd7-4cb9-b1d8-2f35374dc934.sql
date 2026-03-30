-- Remove Lee's problematic shift record from December 2nd, 2025
DELETE FROM public.shift_records 
WHERE id = '628dd122-954c-4628-b3f8-dee640afbf09'
  AND shift_date = '2025-12-02'
  AND operator_id = (SELECT id FROM public.operators WHERE operator_name = 'Lee');