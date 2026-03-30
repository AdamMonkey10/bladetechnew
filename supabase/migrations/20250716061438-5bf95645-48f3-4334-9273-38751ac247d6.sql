-- Fix the current discrepancy for Rob's July 14th timesheet
UPDATE public.timesheet_tracking 
SET 
    timesheet_submitted = true,
    timesheet_submitted_at = now(),
    days_overdue = 0,
    escalation_level = 'none',
    updated_at = now()
WHERE operator_id = '427b457a-ecbf-4907-90ae-94d250c977c9' 
  AND work_date = '2025-07-15'
  AND timesheet_submitted = false;