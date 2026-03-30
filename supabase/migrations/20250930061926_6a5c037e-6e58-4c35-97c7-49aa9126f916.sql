-- Add weight columns to existing warehouse tables and create layout tables

-- Add weight_kg column to warehouse_stock_movements if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouse_stock_movements' AND column_name='weight_kg') THEN
        ALTER TABLE warehouse_stock_movements ADD COLUMN weight_kg NUMERIC(10,2);
    END IF;
END $$;

-- Add weight_kg column to warehouse_products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouse_products' AND column_name='weight_kg') THEN
        ALTER TABLE warehouse_products ADD COLUMN weight_kg NUMERIC(10,2);
    END IF;
END $$;

-- Create layout structure tables if they don't exist
CREATE TABLE IF NOT EXISTS warehouse_aisles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID REFERENCES warehouse_layouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouse_bays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aisle_id UUID REFERENCES warehouse_aisles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    max_weight_kg NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bay_id UUID REFERENCES warehouse_bays(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouse_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    code TEXT NOT NULL UNIQUE,
    max_weight_kg NUMERIC(10,2),
    constraints TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE warehouse_aisles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_bays ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables only
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_aisles' AND policyname = 'Authenticated users can view warehouse aisles') THEN
        CREATE POLICY "Authenticated users can view warehouse aisles" ON warehouse_aisles FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_aisles' AND policyname = 'Authenticated users can manage warehouse aisles') THEN
        CREATE POLICY "Authenticated users can manage warehouse aisles" ON warehouse_aisles FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_bays' AND policyname = 'Authenticated users can view warehouse bays') THEN
        CREATE POLICY "Authenticated users can view warehouse bays" ON warehouse_bays FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_bays' AND policyname = 'Authenticated users can manage warehouse bays') THEN
        CREATE POLICY "Authenticated users can manage warehouse bays" ON warehouse_bays FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_locations' AND policyname = 'Authenticated users can view warehouse locations') THEN
        CREATE POLICY "Authenticated users can view warehouse locations" ON warehouse_locations FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_locations' AND policyname = 'Authenticated users can manage warehouse locations') THEN
        CREATE POLICY "Authenticated users can manage warehouse locations" ON warehouse_locations FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_levels' AND policyname = 'Authenticated users can view warehouse levels') THEN
        CREATE POLICY "Authenticated users can view warehouse levels" ON warehouse_levels FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_levels' AND policyname = 'Authenticated users can manage warehouse levels') THEN
        CREATE POLICY "Authenticated users can manage warehouse levels" ON warehouse_levels FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;