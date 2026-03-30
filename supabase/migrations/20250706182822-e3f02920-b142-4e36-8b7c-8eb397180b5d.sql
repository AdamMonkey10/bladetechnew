-- Phase 1: Add line_item_index to printed_labels for proper progress tracking
ALTER TABLE public.printed_labels 
ADD COLUMN IF NOT EXISTS line_item_index INTEGER DEFAULT 0;

-- Add index for performance on line item queries
CREATE INDEX IF NOT EXISTS idx_printed_labels_po_sku_line_item 
ON public.printed_labels(po, sku, line_item_index);

-- Update the update_po_progress function to handle line item tracking
CREATE OR REPLACE FUNCTION public.update_po_progress(input_po_number TEXT)
RETURNS VOID AS $$
DECLARE
    po_record RECORD;
    item_record RECORD;
    calc_total_required INTEGER := 0;
    calc_total_printed INTEGER := 0;
    calc_boxes_count INTEGER := 0;
    calc_progress_pct NUMERIC(5,2) := 0.00;
BEGIN
    -- Get the PO record
    SELECT * INTO po_record FROM public.customer_pos WHERE po_number = input_po_number;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate totals from PO items
    IF po_record.items IS NOT NULL THEN
        FOR item_record IN 
            SELECT jsonb_array_elements(po_record.items) as item
        LOOP
            calc_total_required := calc_total_required + COALESCE((item_record.item->>'quantity')::INTEGER, 0);
        END LOOP;
    END IF;
    
    -- Calculate printed quantities from printed_labels
    SELECT 
        COALESCE(SUM(quantity), 0),
        COALESCE(COUNT(*), 0)
    INTO calc_total_printed, calc_boxes_count
    FROM public.printed_labels 
    WHERE po = input_po_number;
    
    -- Calculate progress percentage
    IF calc_total_required > 0 THEN
        calc_progress_pct := (calc_total_printed::NUMERIC / calc_total_required::NUMERIC) * 100;
        calc_progress_pct := LEAST(calc_progress_pct, 100.00); -- Cap at 100%
    END IF;
    
    -- Update the customer_pos record
    UPDATE public.customer_pos 
    SET 
        total_printed = calc_total_printed,
        boxes_printed = calc_boxes_count,
        progress_percentage = calc_progress_pct,
        updated_at = now()
    WHERE po_number = input_po_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;