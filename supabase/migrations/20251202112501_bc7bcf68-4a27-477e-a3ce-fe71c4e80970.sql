-- Fix Jamie's incorrect shift records for 2025-12-01
-- Problem: Jamie's early morning shift (05:56-18:07) on 2025-12-01 was incorrectly
-- assigned to 2025-11-30 due to the <6 AM rule applying to Day shifts
-- There are also 4 duplicate records that need to be cleaned up

-- Jamie's correct operator ID
DO $$
DECLARE
  jamie_operator_id UUID := 'd410f2ef-c32f-44b6-88f3-12656dfaf2af';
  keep_record_id UUID := 'eebca703-7dab-444b-8459-6557783745fe';
BEGIN
  -- Delete the 3 duplicate records (keeping the most recent one)
  DELETE FROM shift_records
  WHERE operator_id = jamie_operator_id
    AND shift_date = '2025-11-30'
    AND start_time = '2025-12-01 05:56:00+00'
    AND id != keep_record_id;
  
  -- Update the remaining record to correct shift_date
  UPDATE shift_records
  SET shift_date = '2025-12-01'
  WHERE id = keep_record_id;
  
  -- Update timesheet tracking for 2025-12-01 to mark as submitted
  INSERT INTO timesheet_tracking (
    operator_id,
    work_date,
    clockfy_events_exist,
    timesheet_submitted,
    timesheet_submitted_at,
    days_overdue,
    escalation_level
  )
  VALUES (
    jamie_operator_id,
    '2025-12-01',
    true,
    true,
    now(),
    0,
    'none'
  )
  ON CONFLICT (operator_id, work_date) 
  DO UPDATE SET
    timesheet_submitted = true,
    timesheet_submitted_at = now(),
    days_overdue = 0,
    escalation_level = 'none',
    updated_at = now();
END $$;