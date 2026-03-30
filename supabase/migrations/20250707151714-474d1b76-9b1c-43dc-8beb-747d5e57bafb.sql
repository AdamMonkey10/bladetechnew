-- Create function to safely delete pallets by pallet number
CREATE OR REPLACE FUNCTION public.delete_pallets_by_numbers(pallet_numbers TEXT[])
RETURNS TABLE(deleted_pallet_id UUID, deleted_pallet_number TEXT, had_assignments INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pallet_record RECORD;
    assignment_count INTEGER;
BEGIN
    -- Loop through each pallet number
    FOR pallet_record IN 
        SELECT id, pallet_number FROM public.pallets 
        WHERE pallet_number = ANY(pallet_numbers)
    LOOP
        -- Count assignments for this pallet
        SELECT COUNT(*) INTO assignment_count
        FROM public.pallet_assignments
        WHERE pallet_id = pallet_record.id;
        
        -- Delete any assignments first (if any exist)
        DELETE FROM public.pallet_assignments
        WHERE pallet_id = pallet_record.id;
        
        -- Delete the pallet
        DELETE FROM public.pallets
        WHERE id = pallet_record.id;
        
        -- Return result for this pallet
        deleted_pallet_id := pallet_record.id;
        deleted_pallet_number := pallet_record.pallet_number;
        had_assignments := assignment_count;
        
        RETURN NEXT;
    END LOOP;
END;
$$;