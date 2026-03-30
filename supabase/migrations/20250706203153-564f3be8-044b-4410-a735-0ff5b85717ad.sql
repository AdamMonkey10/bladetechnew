-- First, add any missing suppliers to avoid foreign key violations
INSERT INTO suppliers (id, name) 
SELECT DISTINCT supplier::uuid, 'Unknown Supplier' 
FROM goods_received 
WHERE supplier IS NOT NULL 
  AND supplier != '' 
  AND supplier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND supplier::uuid NOT IN (SELECT id FROM suppliers)
ON CONFLICT (id) DO NOTHING;

-- Convert supplier column from text to uuid
ALTER TABLE goods_received 
ALTER COLUMN supplier TYPE uuid USING supplier::uuid;

-- Now add the foreign key constraint
ALTER TABLE goods_received 
ADD CONSTRAINT fk_goods_received_supplier 
FOREIGN KEY (supplier) REFERENCES suppliers(id);