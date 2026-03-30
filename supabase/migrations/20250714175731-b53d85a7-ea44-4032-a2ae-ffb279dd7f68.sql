-- Remove Lee's duplicate entries from today (keeping first entry from each rapid-click session)
DELETE FROM printed_labels 
WHERE id IN (
  -- Duplicates from rapid clicking (keeping first of each sequence)
  '4af61625-ecf5-4f44-b96c-4a8932ef307f', -- 06:50:55 (keep 06:50:48)
  'd3b56872-d61b-4e5e-8c1d-568f0ea0bb83', -- 06:51:16 (keep 06:51:13)  
  '5b8da5e7-53d7-46c3-b521-09e0f91acb3a', -- 07:05:47 (keep 07:05:42)
  '0bb4d6f8-e41e-4daa-b2ba-41f72f2d1bc8', -- 07:11:11 (keep 07:11:01)
  '278e2721-404a-4d42-9bfa-aa52934dee74', -- 07:11:13 (keep 07:11:01)
  '3c1277ea-f061-44a7-a5d1-cc1a514e1aba', -- 11:01:58 (keep 11:01:53)
  '85d627f4-2c7c-40db-83b8-8cd6f84755c6', -- 11:57:30 (keep 11:57:28)
  'af4cb14a-18e3-4e2c-999c-c879820cd61b', -- 11:58:28 (keep 11:58:27)
  '81768ffd-9322-411a-a238-990654372c6a', -- 11:58:30 (keep 11:58:27)
  'c1a1eeb9-8bb0-4570-8ca8-679258b9f677'  -- 11:58:31 (keep 11:58:27)
);