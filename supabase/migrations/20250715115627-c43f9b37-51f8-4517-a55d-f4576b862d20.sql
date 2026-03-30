-- Fix the update_po_progress function to avoid variable name conflict
CREATE OR REPLACE FUNCTION public.update_po_progress(input_po_number TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    po_record RECORD;
    item_record RECORD;
    calc_line_item_progress JSONB := '{}';
    calc_total_required INTEGER := 0;
    calc_total_printed INTEGER := 0;
    calc_boxes_count INTEGER := 0;
    calc_progress_pct NUMERIC(5,2) := 0.00;
    item_index INTEGER := 0;
    item_printed INTEGER;
    item_required INTEGER;
    item_progress NUMERIC(5,2);
    total_weighted_progress NUMERIC := 0;
    total_weight INTEGER := 0;
BEGIN
    -- Get the PO record
    SELECT * INTO po_record FROM public.customer_pos WHERE po_number = input_po_number;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate progress for each line item
    IF po_record.items IS NOT NULL THEN
        FOR item_record IN 
            SELECT jsonb_array_elements(po_record.items) as item
        LOOP
            item_required := COALESCE((item_record.item->>'quantity')::INTEGER, 0);
            calc_total_required := calc_total_required + item_required;
            
            -- Get printed quantity for this specific SKU
            SELECT COALESCE(SUM(quantity), 0)
            INTO item_printed
            FROM public.printed_labels 
            WHERE po = input_po_number 
            AND sku = (item_record.item->>'sku');
            
            -- Calculate progress for this line item
            IF item_required > 0 THEN
                item_progress := (item_printed::NUMERIC / item_required::NUMERIC) * 100;
                item_progress := LEAST(item_progress, 100.00); -- Cap at 100%
            ELSE
                item_progress := 0.00;
            END IF;
            
            -- Store line item progress
            calc_line_item_progress := calc_line_item_progress || jsonb_build_object(
                item_index::TEXT,
                jsonb_build_object(
                    'sku', item_record.item->>'sku',
                    'printed', item_printed,
                    'required', item_required,
                    'progress', item_progress
                )
            );
            
            -- Add to weighted progress calculation
            total_weighted_progress := total_weighted_progress + (item_progress * item_required);
            total_weight := total_weight + item_required;
            
            item_index := item_index + 1;
        END LOOP;
    END IF;
    
    -- Calculate total printed quantities from printed_labels
    SELECT 
        COALESCE(SUM(quantity), 0),
        COALESCE(COUNT(*), 0)
    INTO calc_total_printed, calc_boxes_count
    FROM public.printed_labels 
    WHERE po = input_po_number;
    
    -- Calculate overall progress as weighted average
    IF total_weight > 0 THEN
        calc_progress_pct := ROUND(total_weighted_progress / total_weight, 2);
    ELSE
        calc_progress_pct := 0.00;
    END IF;
    
    -- Update the customer_pos record
    UPDATE public.customer_pos 
    SET 
        total_printed = calc_total_printed,
        boxes_printed = calc_boxes_count,
        progress_percentage = calc_progress_pct,
        line_item_progress = calc_line_item_progress,
        updated_at = now()
    WHERE po_number = input_po_number;
END;
$$;