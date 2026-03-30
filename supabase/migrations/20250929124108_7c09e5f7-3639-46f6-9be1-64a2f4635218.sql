-- 1) Create warehouse_stock_movements table (if missing)
CREATE TABLE IF NOT EXISTS public.warehouse_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.warehouse_products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN','OUT','TRANSFER')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  from_slot_code TEXT,
  to_slot_code TEXT,
  goods_received_id UUID REFERENCES public.goods_received(id) ON DELETE SET NULL,
  performed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wsm_goods_received ON public.warehouse_stock_movements(goods_received_id);
CREATE INDEX IF NOT EXISTS idx_wsm_product ON public.warehouse_stock_movements(product_id);

-- 3) Enable RLS and add policies for authenticated users
ALTER TABLE public.warehouse_stock_movements ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warehouse_stock_movements' AND policyname='Authenticated can view stock movements'
  ) THEN
    CREATE POLICY "Authenticated can view stock movements"
    ON public.warehouse_stock_movements
    FOR SELECT
    USING (auth.role() = 'authenticated'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warehouse_stock_movements' AND policyname='Authenticated can insert stock movements'
  ) THEN
    CREATE POLICY "Authenticated can insert stock movements"
    ON public.warehouse_stock_movements
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated'::text);
  END IF;
END $$;

-- 4) Allow authenticated users to update warehouse tracking fields on goods_received
-- Existing UPDATE policy requires auth.uid() = user_id which blocks warehouse users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goods_received' AND policyname='Authenticated can update warehouse tracking fields'
  ) THEN
    CREATE POLICY "Authenticated can update warehouse tracking fields"
    ON public.goods_received
    FOR UPDATE
    USING (auth.role() = 'authenticated'::text)
    WITH CHECK (auth.role() = 'authenticated'::text);
  END IF;
END $$;
