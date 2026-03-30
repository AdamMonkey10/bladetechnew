-- Remove unnecessary columns from printed_labels table
ALTER TABLE public.printed_labels 
DROP COLUMN IF EXISTS pallet_id,
DROP COLUMN IF EXISTS firebase_created_at;