-- Create function to delete all printed labels from a specific date
CREATE OR REPLACE FUNCTION public.delete_printed_labels_by_date(target_date DATE)
RETURNS TABLE(deleted_count INTEGER, deleted_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_record_ids UUID[];
    total_deleted INTEGER;
BEGIN
    -- Collect IDs of labels to be deleted
    SELECT ARRAY_AGG(id) INTO deleted_record_ids
    FROM public.printed_labels
    WHERE print_date = target_date;
    
    -- Delete the labels and count them
    DELETE FROM public.printed_labels
    WHERE print_date = target_date;
    
    GET DIAGNOSTICS total_deleted = ROW_COUNT;
    
    -- Return results
    deleted_count := total_deleted;
    deleted_ids := deleted_record_ids;
    
    RETURN NEXT;
END;
$$;