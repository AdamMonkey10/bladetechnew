-- Create pallets table
CREATE TABLE public.pallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pallet_number TEXT NOT NULL UNIQUE,
  customer TEXT NOT NULL,
  po_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'shipped')),
  max_capacity INTEGER NOT NULL DEFAULT 48,
  current_count INTEGER NOT NULL DEFAULT 0,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create pallet_assignments junction table
CREATE TABLE public.pallet_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pallet_id UUID NOT NULL REFERENCES public.pallets(id) ON DELETE CASCADE,
  printed_label_id UUID NOT NULL REFERENCES public.printed_labels(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  UNIQUE(printed_label_id) -- Ensure each label can only be assigned to one pallet
);

-- Create pallet number sequence table
CREATE TABLE public.pallet_number_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  current_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Function to generate next pallet number
CREATE OR REPLACE FUNCTION public.generate_next_pallet_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to update pallet counts
CREATE OR REPLACE FUNCTION public.update_pallet_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update pallet counts when label is assigned
        UPDATE public.pallets 
        SET 
            current_count = current_count + 1,
            total_quantity = total_quantity + (
                SELECT quantity FROM public.printed_labels WHERE id = NEW.printed_label_id
            ),
            updated_at = now()
        WHERE id = NEW.pallet_id;
        
        -- Auto-complete pallet if it reaches max capacity
        UPDATE public.pallets 
        SET 
            status = 'completed',
            completed_at = now(),
            updated_at = now()
        WHERE id = NEW.pallet_id AND current_count >= max_capacity AND status = 'active';
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Update pallet counts when label is unassigned
        UPDATE public.pallets 
        SET 
            current_count = current_count - 1,
            total_quantity = total_quantity - (
                SELECT quantity FROM public.printed_labels WHERE id = OLD.printed_label_id
            ),
            updated_at = now()
        WHERE id = OLD.pallet_id;
        
        -- Reactivate pallet if it was completed and now has space
        UPDATE public.pallets 
        SET 
            status = 'active',
            completed_at = NULL,
            updated_at = now()
        WHERE id = OLD.pallet_id AND status = 'completed' AND current_count < max_capacity;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Create trigger for automatic pallet count updates
CREATE TRIGGER update_pallet_counts_trigger
    AFTER INSERT OR DELETE ON public.pallet_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_pallet_counts();

-- Create trigger for updated_at on pallets
CREATE TRIGGER update_pallets_updated_at
    BEFORE UPDATE ON public.pallets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on pallet_number_sequences
CREATE TRIGGER update_pallet_sequences_updated_at
    BEFORE UPDATE ON public.pallet_number_sequences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on pallets table
ALTER TABLE public.pallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for pallets
CREATE POLICY "Users can create pallets" 
ON public.pallets 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view all pallets" 
ON public.pallets 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their pallets" 
ON public.pallets 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Enable RLS on pallet_assignments table
ALTER TABLE public.pallet_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for pallet_assignments
CREATE POLICY "Users can create pallet assignments" 
ON public.pallet_assignments 
FOR INSERT 
WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Users can view all pallet assignments" 
ON public.pallet_assignments 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their pallet assignments" 
ON public.pallet_assignments 
FOR DELETE 
USING (auth.uid() = assigned_by);

-- Enable RLS on pallet_number_sequences table
ALTER TABLE public.pallet_number_sequences ENABLE ROW LEVEL SECURITY;

-- RLS policies for pallet_number_sequences
CREATE POLICY "Authenticated users can view sequences" 
ON public.pallet_number_sequences 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create sequences" 
ON public.pallet_number_sequences 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sequences" 
ON public.pallet_number_sequences 
FOR UPDATE 
USING (auth.role() = 'authenticated');