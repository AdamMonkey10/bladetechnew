-- Clean up invalid milwaukee_test_reports records
-- Remove records with NULL foreign key references that prevent proper reporting

-- First, let's see what we're removing (for documentation)
-- Records with NULL machine_id, operator_id, or product_id cannot be properly displayed
-- These likely came from import attempts where mapping failed

DELETE FROM public.milwaukee_test_reports 
WHERE machine_id IS NULL 
   OR operator_id IS NULL 
   OR product_id IS NULL;

-- Add a comment for future reference
COMMENT ON TABLE public.milwaukee_test_reports IS 'Test reports table cleaned up to remove records with missing foreign key references';