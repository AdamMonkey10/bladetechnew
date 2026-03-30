-- Clear all warehouse stock data while preserving layout structure

-- Clear warehouse slot inventory (removes all stock quantities from slots)
DELETE FROM public.warehouse_slot_inventory;

-- Clear warehouse stock movements (removes all movement history)  
DELETE FROM public.warehouse_stock_movements;

-- Clear warehouse products (removes all product definitions from warehouse)
DELETE FROM public.warehouse_products;

-- Note: warehouse_layouts table is preserved to maintain physical structure
-- Note: stock_items table is preserved as it appears separate from warehouse system