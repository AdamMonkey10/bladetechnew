-- Add goods_received_id to warehouse_stock_movements for traceability
ALTER TABLE public.warehouse_stock_movements 
ADD COLUMN goods_received_id UUID REFERENCES public.goods_received(id);

-- Add index for better performance
CREATE INDEX idx_warehouse_stock_movements_goods_received 
ON public.warehouse_stock_movements(goods_received_id);

-- Add warehouse_status tracking to goods_received
ALTER TABLE public.goods_received 
ADD COLUMN warehouse_status TEXT DEFAULT 'pending',
ADD COLUMN warehouse_quantity_moved INTEGER DEFAULT 0;

-- Add check constraint for warehouse_status
ALTER TABLE public.goods_received 
ADD CONSTRAINT check_warehouse_status 
CHECK (warehouse_status IN ('pending', 'partial', 'completed'));