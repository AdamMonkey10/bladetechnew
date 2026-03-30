-- Fix Rob's misdated Dec 5 timesheet (was saved as Dec 6)
-- Rob submitted while on shift at 01:48 AM Dec 6, but work started Dec 5 17:23

DO $$
DECLARE
  rob_operator_id UUID := '427b457a-ecbf-4907-90ae-94d250c977c9';
  record_id UUID := '03864769-3c77-417d-a397-7fbe6349cb2d';
BEGIN
  -- Update the shift_record to correct date
  UPDATE shift_records
  SET shift_date = '2025-12-05',
      start_time = '2025-12-05 17:23:00+00'
  WHERE id = record_id;
  
  -- Mark Dec 5 timesheet as submitted
  UPDATE timesheet_tracking
  SET timesheet_submitted = true,
      timesheet_submitted_at = now(),
      days_overdue = 0,
      escalation_level = 'none',
      updated_at = now()
  WHERE operator_id = rob_operator_id
    AND work_date = '2025-12-05';
    
  -- If no tracking record exists for Dec 5, create one
  INSERT INTO timesheet_tracking (operator_id, work_date, clockfy_events_exist, timesheet_submitted, timesheet_submitted_at, days_overdue, escalation_level)
  SELECT rob_operator_id, '2025-12-05', true, true, now(), 0, 'none'
  WHERE NOT EXISTS (
    SELECT 1 FROM timesheet_tracking 
    WHERE operator_id = rob_operator_id AND work_date = '2025-12-05'
  );
END $$;