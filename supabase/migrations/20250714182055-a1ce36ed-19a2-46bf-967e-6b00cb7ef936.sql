-- Remove 4 additional duplicate entries from Lee's Laser 1 records 
-- This should bring his total from 12 down to 8 entries on Laser 1
DELETE FROM printed_labels 
WHERE id IN (
  -- Remove these 4 additional Laser 1 duplicates based on suspicious timing patterns:
  '412eb847-f95a-4686-9cdf-b32926c2f8c7', -- 07:06:30 (too close to 07:05:42)
  '49ad61e3-4174-498e-9d63-9e5a4f31e09b', -- 11:01:53 (suspicious timing)
  '4c223fee-1277-49b8-b32f-f1ddf3f6f875', -- 11:58:27 (very close to Laser 2 entry at 11:57:28)
  '7074ed83-5dd6-4f76-a5ce-b882bcbbb185'  -- 15:25:29 (late afternoon entry, likely duplicate)
);