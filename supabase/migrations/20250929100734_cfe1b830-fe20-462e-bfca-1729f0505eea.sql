-- Create goods_out table for tracking outgoing inventory
CREATE TABLE public.goods_out (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_dispatched INTEGER NOT NULL DEFAULT 0,
  raw_material_id UUID REFERENCES public.raw_materials(id),
  customer_id UUID REFERENCES public.customers(id),
  destination TEXT,
  reference_number TEXT,
  invoice TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on goods_out
ALTER TABLE public.goods_out ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goods_out
CREATE POLICY "Users can create goods out records" 
ON public.goods_out 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their goods out records" 
ON public.goods_out 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all goods out records" 
ON public.goods_out 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Create goods movements view for unified tracking
CREATE VIEW public.goods_movements AS
SELECT 
  'IN' as movement_type,
  id,
  received_date as movement_date,
  quantity_received as quantity,
  raw_material_id,
  supplier::text as partner,
  reference_number,
  invoice,
  notes,
  user_id,
  created_at
FROM public.goods_received
UNION ALL
SELECT 
  'OUT' as movement_type,
  id,
  dispatch_date as movement_date,
  quantity_dispatched as quantity,
  raw_material_id,
  destination as partner,
  reference_number,
  invoice,
  notes,
  user_id,
  created_at
FROM public.goods_out
ORDER BY movement_date DESC, created_at DESC;

-- Create updated_at trigger for goods_out
CREATE TRIGGER update_goods_out_updated_at
    BEFORE UPDATE ON public.goods_out
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create stock levels tracking function
CREATE OR REPLACE FUNCTION public.get_stock_levels()
RETURNS TABLE(
  material_id UUID,
  material_code TEXT,
  material_name TEXT,
  total_received BIGINT,
  total_dispatched BIGINT,
  current_stock BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rm.id as material_id,
    rm.material_code,
    rm.material_name,
    COALESCE(received.total_in, 0) as total_received,
    COALESCE(dispatched.total_out, 0) as total_dispatched,
    COALESCE(received.total_in, 0) - COALESCE(dispatched.total_out, 0) as current_stock
  FROM public.raw_materials rm
  LEFT JOIN (
    SELECT 
      raw_material_id,
      SUM(quantity_received) as total_in
    FROM public.goods_received
    GROUP BY raw_material_id
  ) received ON rm.id = received.raw_material_id
  LEFT JOIN (
    SELECT 
      raw_material_id,
      SUM(quantity_dispatched) as total_out
    FROM public.goods_out
    GROUP BY raw_material_id
  ) dispatched ON rm.id = dispatched.raw_material_id
  ORDER BY rm.material_code;
END;
$$;