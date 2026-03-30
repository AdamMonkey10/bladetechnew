-- Fix Craig's incorrect shift records for 2025-12-04
-- Craig's operator_id: 0d242008-23d4-4229-bd2d-7a411fe041ed
-- 2 duplicate records exist with shift_date 2025-12-03 but start_time on 2025-12-04

DO $$
DECLARE
  craig_operator_id UUID := '0d242008-23d4-4229-bd2d-7a411fe041ed';
  keep_record_id UUID := '1d549518-88fe-43b5-917b-d34790f6f225'; -- most recent
BEGIN
  -- Delete the duplicate record
  DELETE FROM shift_records
  WHERE operator_id = craig_operator_id
    AND shift_date = '2025-12-03'
    AND start_time::date = '2025-12-04'
    AND id != keep_record_id;
  
  -- Update the remaining record to correct shift_date
  UPDATE shift_records
  SET shift_date = '2025-12-04'
  WHERE id = keep_record_id;
  
  -- Update timesheet tracking for 2025-12-04 to mark as submitted
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
    craig_operator_id,
    '2025-12-04',
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