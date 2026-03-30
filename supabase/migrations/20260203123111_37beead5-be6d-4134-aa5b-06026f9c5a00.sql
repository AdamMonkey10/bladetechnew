-- Phase 1: Fix printer_settings table

-- Step 1: Delete duplicate rows, keeping only the newest per user_id
DELETE FROM public.printer_settings
WHERE id NOT IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as rn
        FROM public.printer_settings
    ) ranked
    WHERE rn = 1
);

-- Step 2: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS printer_settings_user_id_unique 
ON public.printer_settings(user_id);

-- Step 3: Set sensible defaults for label dimensions
ALTER TABLE public.printer_settings 
    ALTER COLUMN label_width_mm SET DEFAULT 100,
    ALTER COLUMN label_height_mm SET DEFAULT 100;