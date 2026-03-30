-- Phase 1: Fix database function search paths for security hardening
-- All functions should have explicit search_path to prevent injection

-- Update existing functions to include secure search_path settings
CREATE OR REPLACE FUNCTION public.generate_next_box_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    box_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM now());
    
    -- Insert or update the sequence for current year
    INSERT INTO public.box_number_sequences (year, current_number)
    VALUES (current_year, 1)
    ON CONFLICT (year) 
    DO UPDATE SET 
        current_number = box_number_sequences.current_number + 1,
        updated_at = now()
    RETURNING current_number INTO next_number;
    
    -- Format the box number
    box_number := 'BOX-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN box_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_next_pallet_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    pallet_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM now());
    
    -- Insert or update the sequence for current year
    INSERT INTO public.pallet_number_sequences (year, current_number)
    VALUES (current_year, 1)
    ON CONFLICT (year) 
    DO UPDATE SET 
        current_number = pallet_number_sequences.current_number + 1,
        updated_at = now()
    RETURNING current_number INTO next_number;
    
    -- Format the pallet number
    pallet_number := 'PAL-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN pallet_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_po_progress(input_po_number text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- Create audit logging table for operational security
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    timestamp timestamp with time zone DEFAULT now(),
    ip_address inet,
    user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can view audit logs
CREATE POLICY "Authenticated users can view audit logs" 
ON public.audit_log 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Insert audit record for UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (
            user_id, 
            action, 
            table_name, 
            record_id, 
            old_values, 
            new_values
        ) VALUES (
            auth.uid(),
            'UPDATE',
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    
    -- Insert audit record for DELETE operations
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (
            user_id, 
            action, 
            table_name, 
            record_id, 
            old_values
        ) VALUES (
            auth.uid(),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    
    -- Insert audit record for INSERT operations
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (
            user_id, 
            action, 
            table_name, 
            record_id, 
            new_values
        ) VALUES (
            auth.uid(),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$function$;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_customer_pos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.customer_pos
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_shift_records_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.shift_records
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_printed_labels_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.printed_labels
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();