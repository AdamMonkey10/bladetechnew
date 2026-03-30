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

-- Add constraints to prevent future empty record creation
-- Ensure critical fields are required for meaningful test reports
ALTER TABLE public.milwaukee_test_reports 
ADD CONSTRAINT check_test_data_not_empty 
CHECK (test_data IS NOT NULL AND test_data != '{}');

-- Ensure total_saws is provided for meaningful test results
ALTER TABLE public.milwaukee_test_reports 
ADD CONSTRAINT check_total_saws_positive 
CHECK (total_saws IS NOT NULL AND total_saws > 0);

-- Ensure defect_rate is calculated and stored
ALTER TABLE public.milwaukee_test_reports 
ADD CONSTRAINT check_defect_rate_valid 
CHECK (defect_rate IS NOT NULL AND defect_rate >= 0 AND defect_rate <= 1);

-- Create an index for better query performance on the Reports page
CREATE INDEX IF NOT EXISTS idx_milwaukee_test_reports_test_date_desc 
ON public.milwaukee_test_reports (test_date DESC);

-- Create an index for filtering by test results
CREATE INDEX IF NOT EXISTS idx_milwaukee_test_reports_test_passed 
ON public.milwaukee_test_reports USING GIN ((test_data->'test_passed'));

-- Update updated_at trigger for milwaukee_test_reports if not exists
CREATE TRIGGER IF NOT EXISTS update_milwaukee_test_reports_updated_at
BEFORE UPDATE ON public.milwaukee_test_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();