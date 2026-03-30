-- Update box_amount values for products based on the provided JSON data
UPDATE public.products 
SET box_amount = 900 
WHERE product_code = 'CPPL200.1';

UPDATE public.products 
SET box_amount = 448 
WHERE product_code IN ('UK32BM001', 'UK32RW001', 'UK44BM001', 'UK63RW001');

-- Add comment for documentation
COMMENT ON COLUMN public.products.box_amount IS 'Number of items per box for label printing calculations';