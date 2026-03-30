-- Add foreign key constraint to link goods_received.supplier to suppliers table
-- First, let's see what supplier UUIDs exist in goods_received that might not be in suppliers
INSERT INTO suppliers (id, name) 
SELECT DISTINCT supplier::uuid, 'Unknown Supplier' 
FROM goods_received 
WHERE supplier IS NOT NULL 
  AND supplier != '' 
  AND supplier::uuid NOT IN (SELECT id FROM suppliers)
ON CONFLICT (id) DO NOTHING;

-- Now add the foreign key constraint
ALTER TABLE goods_received 
ADD CONSTRAINT fk_goods_received_supplier 
FOREIGN KEY (supplier) REFERENCES suppliers(id);