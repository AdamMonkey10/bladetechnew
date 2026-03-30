-- Create warehouse_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.warehouse_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    barcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouse_products ENABLE ROW LEVEL SECURITY;

-- Create policies for warehouse_products (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'warehouse_products' 
        AND policyname = 'Authenticated users can view warehouse products'
    ) THEN
        CREATE POLICY "Authenticated users can view warehouse products" 
        ON public.warehouse_products 
        FOR SELECT 
        USING (auth.role() = 'authenticated'::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'warehouse_products' 
        AND policyname = 'Authenticated users can create warehouse products'
    ) THEN
        CREATE POLICY "Authenticated users can create warehouse products" 
        ON public.warehouse_products 
        FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated'::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'warehouse_products' 
        AND policyname = 'Authenticated users can update warehouse products'
    ) THEN
        CREATE POLICY "Authenticated users can update warehouse products" 
        ON public.warehouse_products 
        FOR UPDATE 
        USING (auth.role() = 'authenticated'::text);
    END IF;
END $$;