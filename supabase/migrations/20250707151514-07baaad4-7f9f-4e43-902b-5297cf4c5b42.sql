-- Create improved function to safely delete printed labels and their pallet assignments
CREATE OR REPLACE FUNCTION public.delete_test_labels_by_date(target_date DATE)
RETURNS TABLE(deleted_labels INTEGER, deleted_assignments INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_count INTEGER := 0;
    label_count INTEGER := 0;
BEGIN
    -- First, delete pallet assignments for labels from target date
    DELETE FROM public.pallet_assignments
    WHERE printed_label_id IN (
        SELECT id FROM public.printed_labels WHERE print_date = target_date
    );
    
    GET DIAGNOSTICS assignment_count = ROW_COUNT;
    
    -- Then delete the printed labels
    DELETE FROM public.printed_labels
    WHERE print_date = target_date;
    
    GET DIAGNOSTICS label_count = ROW_COUNT;
    
    -- Return results
    deleted_labels := label_count;
    deleted_assignments := assignment_count;
    
    RETURN NEXT;
END;
$$;