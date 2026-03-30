-- Clean up products table - remove all the placeholder products, keep only the real raw material
DELETE FROM public.product_specifications WHERE product_code IN ('CPPL200.1', 'CPPL360', 'UK32BM001', 'UK32RW001', 'UK44BM001', 'UK63RW001');

DELETE FROM public.products WHERE product_code IN ('CPPL200.1', 'CPPL360', 'UK32BM001', 'UK32RW001', 'UK44BM001', 'UK63RW001');