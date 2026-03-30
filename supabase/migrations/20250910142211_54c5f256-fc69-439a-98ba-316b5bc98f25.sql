-- Create warehouse-related tables

-- Warehouse layouts table
CREATE TABLE public.warehouse_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  layout_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Warehouse products table
CREATE TABLE public.warehouse_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  barcode TEXT,
  dimensions_mm JSONB, -- {l: number, w: number, h: number}
  weight_kg NUMERIC,
  min_qty INTEGER,
  max_qty INTEGER,
  expiry_date DATE,
  attributes JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Warehouse slot inventory table
CREATE TABLE public.warehouse_slot_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_code TEXT NOT NULL,
  product_id UUID REFERENCES public.warehouse_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slot_code, product_id)
);

-- Warehouse stock movements table for audit trail
CREATE TABLE public.warehouse_stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.warehouse_products(id),
  from_slot_code TEXT,
  to_slot_code TEXT,
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('move', 'add', 'remove')),
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.warehouse_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_slot_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warehouse_layouts
CREATE POLICY "Users can view all warehouse layouts" 
ON public.warehouse_layouts FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create warehouse layouts" 
ON public.warehouse_layouts FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their warehouse layouts" 
ON public.warehouse_layouts FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for warehouse_products
CREATE POLICY "Users can view all warehouse products" 
ON public.warehouse_products FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create warehouse products" 
ON public.warehouse_products FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their warehouse products" 
ON public.warehouse_products FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their warehouse products" 
ON public.warehouse_products FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for warehouse_slot_inventory
CREATE POLICY "Users can view all slot inventory" 
ON public.warehouse_slot_inventory FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage slot inventory" 
ON public.warehouse_slot_inventory FOR ALL 
USING (auth.role() = 'authenticated');

-- RLS Policies for warehouse_stock_movements
CREATE POLICY "Users can view all stock movements" 
ON public.warehouse_stock_movements FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create stock movements" 
ON public.warehouse_stock_movements FOR INSERT 
WITH CHECK (auth.uid() = performed_by);

-- Create indexes for better performance
CREATE INDEX idx_warehouse_products_sku ON public.warehouse_products(sku);
CREATE INDEX idx_warehouse_products_barcode ON public.warehouse_products(barcode);
CREATE INDEX idx_warehouse_slot_inventory_slot_code ON public.warehouse_slot_inventory(slot_code);
CREATE INDEX idx_warehouse_slot_inventory_product_id ON public.warehouse_slot_inventory(product_id);
CREATE INDEX idx_warehouse_stock_movements_product_id ON public.warehouse_stock_movements(product_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_warehouse_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_warehouse_layouts_updated_at
    BEFORE UPDATE ON public.warehouse_layouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_warehouse_updated_at_column();

CREATE TRIGGER update_warehouse_products_updated_at
    BEFORE UPDATE ON public.warehouse_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_warehouse_updated_at_column();

CREATE TRIGGER update_warehouse_slot_inventory_updated_at
    BEFORE UPDATE ON public.warehouse_slot_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_warehouse_updated_at_column();