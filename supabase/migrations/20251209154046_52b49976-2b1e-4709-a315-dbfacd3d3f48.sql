-- Fix Jamie's incorrect shift records for 2025-12-03
-- Jamie worked 05:56-18:11 on 2025-12-03 but records assigned to 2025-12-02
-- 3 duplicate records exist

DO $$
DECLARE
  jamie_operator_id UUID := 'd410f2ef-c32f-44b6-88f3-12656dfaf2af';
  keep_record_id UUID := '7c7ef5c5-9164-4ee3-9dab-a5798d077d6b'; -- most recent
BEGIN
  -- Delete the 2 duplicate records
  DELETE FROM shift_records
  WHERE operator_id = jamie_operator_id
    AND shift_date = '2025-12-02'
    AND start_time::date = '2025-12-03'
    AND id != keep_record_id;
  
  -- Update the remaining record to correct shift_date
  UPDATE shift_records
  SET shift_date = '2025-12-03'
  WHERE id = keep_record_id;
  
  -- Update timesheet tracking for 2025-12-03 to mark as submitted
  UPDATE timesheet_tracking
  SET timesheet_submitted = true,
      timesheet_submitted_at = now(),
      days_overdue = 0,
      escalation_level = 'none',
      updated_at = now()
  WHERE operator_id = jamie_operator_id
    AND work_date = '2025-12-03';
END $$;