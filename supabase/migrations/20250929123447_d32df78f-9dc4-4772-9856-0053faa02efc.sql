-- Create warehouse_slot_inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.warehouse_slot_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_code TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.warehouse_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(slot_code, product_id)
);

-- Enable RLS
ALTER TABLE public.warehouse_slot_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for warehouse_slot_inventory (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'warehouse_slot_inventory' 
        AND policyname = 'Authenticated users can view slot inventory'
    ) THEN
        CREATE POLICY "Authenticated users can view slot inventory" 
        ON public.warehouse_slot_inventory 
        FOR SELECT 
        USING (auth.role() = 'authenticated'::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'warehouse_slot_inventory' 
        AND policyname = 'Authenticated users can manage slot inventory'
    ) THEN
        CREATE POLICY "Authenticated users can manage slot inventory" 
        ON public.warehouse_slot_inventory 
        FOR ALL 
        USING (auth.role() = 'authenticated'::text)
        WITH CHECK (auth.role() = 'authenticated'::text);
    END IF;
END $$;