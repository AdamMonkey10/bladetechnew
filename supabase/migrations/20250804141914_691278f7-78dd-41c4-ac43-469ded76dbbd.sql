-- Update the shift_records UPDATE policy to allow all authenticated users
-- This is needed for timesheet management where supervisors can edit operator timesheets
DROP POLICY IF EXISTS "Users can update their shift records" ON public.shift_records;

CREATE POLICY "Authenticated users can update shift records" 
ON public.shift_records 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);