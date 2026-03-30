ALTER TABLE public.warehouse_stock_movements
  DROP CONSTRAINT IF EXISTS warehouse_stock_movements_movement_type_check;

ALTER TABLE public.warehouse_stock_movements
  ADD CONSTRAINT warehouse_stock_movements_movement_type_check
  CHECK (upper(movement_type) IN ('IN','OUT','TRANSFER'));
