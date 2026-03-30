-- Remove 5 duplicate entries from Lee's Laser 1 records to get from 13 down to 8 entries
-- Keep all 5 Laser 2 entries as they are reasonable for the day's work
DELETE FROM printed_labels 
WHERE id IN (
  -- Remove these 5 Laser 1 duplicates based on rapid-click patterns:
  'f1f05c40-c0ff-42cb-9da0-925b37820e24', -- 06:51:13 (too close to 06:50:48)
  '5b8da5e7-53d7-46c3-b521-09e0f91acb3a', -- 07:05:47 (keep 07:05:42 instead)
  '41070da1-2c3d-4b10-9aa9-898f85f10713', -- 07:07:10 (too close to previous)
  '85d627f4-2c7c-40db-83b8-8cd6f84755c6', -- 11:57:30 (rapid-click sequence)
  'af4cb14a-18e3-4e2c-999c-c879820cd61b'  -- 11:58:28 (rapid-click sequence)
);