-- Clean up empty milwaukee_test_reports records that only have id and test_date
-- These are preventing the Reports page from displaying actual test data properly

DELETE FROM public.milwaukee_test_reports 
WHERE test_data IS NULL 
  AND total_saws IS NULL 
  AND total_defects IS NULL 
  AND defect_rate IS NULL 
  AND machine_id IS NULL 
  AND product_id IS NULL 
  AND operator_id IS NULL 
  AND shift IS NULL 
  AND user_id IS NULL;

-- Create indexes for better query performance on the Reports page
CREATE INDEX IF NOT EXISTS idx_milwaukee_test_reports_test_date_desc 
ON public.milwaukee_test_reports (test_date DESC);

-- Create an index for filtering by test results
CREATE INDEX IF NOT EXISTS idx_milwaukee_test_reports_test_passed 
ON public.milwaukee_test_reports USING GIN ((test_data->'test_passed'));

-- Create trigger for automatic timestamp updates (drop first if exists)
DROP TRIGGER IF EXISTS update_milwaukee_test_reports_updated_at ON public.milwaukee_test_reports;
CREATE TRIGGER update_milwaukee_test_reports_updated_at
BEFORE UPDATE ON public.milwaukee_test_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();