-- Fix critical security issues: Remove public access to sensitive business data
-- This migration restricts public SELECT policies to authenticated users only

-- 1. Fix operators table (employee data exposure)
DROP POLICY IF EXISTS "Public can view all operators" ON public.operators;
CREATE POLICY "Authenticated users can view operators" 
  ON public.operators 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 2. Fix products table (product catalog exposure)
DROP POLICY IF EXISTS "Public can view all products" ON public.products;
CREATE POLICY "Authenticated users can view products" 
  ON public.products 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 3. Fix product_specifications table (manufacturing specs exposure)
DROP POLICY IF EXISTS "Public can view all specifications" ON public.product_specifications;
CREATE POLICY "Authenticated users can view specifications" 
  ON public.product_specifications 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 4. Fix stock_items table (inventory data exposure)
DROP POLICY IF EXISTS "Public can view all stock items" ON public.stock_items;
CREATE POLICY "Authenticated users can view stock items" 
  ON public.stock_items 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 5. Fix product_materials table (BOM exposure)
DROP POLICY IF EXISTS "Public can view product materials" ON public.product_materials;
CREATE POLICY "Authenticated users can view product materials" 
  ON public.product_materials 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 6. Fix raw_materials table (similar exposure pattern)
DROP POLICY IF EXISTS "Public can view all raw materials" ON public.raw_materials;
CREATE POLICY "Authenticated users can view raw materials" 
  ON public.raw_materials 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 7. Fix suppliers table (supplier relationships exposure)
DROP POLICY IF EXISTS "Public can view all suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can view suppliers" 
  ON public.suppliers 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 8. Fix raw_material_specifications table (raw material specs exposure)
DROP POLICY IF EXISTS "Public can view all raw material specifications" ON public.raw_material_specifications;
CREATE POLICY "Authenticated users can view raw material specifications" 
  ON public.raw_material_specifications 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 9. Fix machines table (equipment data exposure)
DROP POLICY IF EXISTS "Public can view all machines" ON public.machines;
CREATE POLICY "Authenticated users can view machines" 
  ON public.machines 
  FOR SELECT 
  USING (auth.role() = 'authenticated');