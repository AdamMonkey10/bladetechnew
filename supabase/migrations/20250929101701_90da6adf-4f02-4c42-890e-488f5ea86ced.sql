-- Fix security definer view by recreating without definer property
DROP VIEW public.goods_movements;

-- Recreate the view without security definer to fix linter errors
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

-- Fix function search path for get_stock_levels
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
SET search_path = public
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