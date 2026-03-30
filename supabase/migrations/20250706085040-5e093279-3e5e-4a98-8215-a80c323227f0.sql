-- Step 1: Add progress tracking columns to customer_pos table
ALTER TABLE public.customer_pos 
ADD COLUMN IF NOT EXISTS total_printed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS boxes_printed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC(5,2) DEFAULT 0.00;

-- Step 2: Add indexes for performance on printed_labels table
CREATE INDEX IF NOT EXISTS idx_printed_labels_po ON public.printed_labels(po);
CREATE INDEX IF NOT EXISTS idx_printed_labels_sku ON public.printed_labels(sku);
CREATE INDEX IF NOT EXISTS idx_printed_labels_po_sku ON public.printed_labels(po, sku);

-- Step 3: Create function to calculate and update PO progress
CREATE OR REPLACE FUNCTION public.update_po_progress(input_po_number TEXT)
RETURNS VOID AS $$
DECLARE
    po_record RECORD;
    item_record RECORD;
    total_required INTEGER := 0;
    total_printed INTEGER := 0;
    boxes_count INTEGER := 0;
    progress_pct NUMERIC(5,2) := 0.00;
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
            total_required := total_required + COALESCE((item_record.item->>'quantity')::INTEGER, 0);
        END LOOP;
    END IF;
    
    -- Calculate printed quantities from printed_labels
    SELECT 
        COALESCE(SUM(quantity), 0),
        COALESCE(COUNT(*), 0)
    INTO total_printed, boxes_count
    FROM public.printed_labels 
    WHERE po = input_po_number;
    
    -- Calculate progress percentage
    IF total_required > 0 THEN
        progress_pct := (total_printed::NUMERIC / total_required::NUMERIC) * 100;
        progress_pct := LEAST(progress_pct, 100.00); -- Cap at 100%
    END IF;
    
    -- Update the customer_pos record
    UPDATE public.customer_pos 
    SET 
        total_printed = total_printed,
        boxes_printed = boxes_count,
        progress_percentage = progress_pct,
        updated_at = now()
    WHERE po_number = input_po_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger function to auto-update progress
CREATE OR REPLACE FUNCTION public.trigger_update_po_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.update_po_progress(NEW.po);
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        PERFORM public.update_po_progress(OLD.po);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on printed_labels table
DROP TRIGGER IF EXISTS trigger_printed_labels_progress ON public.printed_labels;
CREATE TRIGGER trigger_printed_labels_progress
    AFTER INSERT OR UPDATE OR DELETE ON public.printed_labels
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_po_progress();

-- Step 6: Initialize progress for existing POs
DO $$
DECLARE
    po_rec RECORD;
BEGIN
    FOR po_rec IN SELECT DISTINCT po_number FROM public.customer_pos
    LOOP
        PERFORM public.update_po_progress(po_rec.po_number);
    END LOOP;
END $$;