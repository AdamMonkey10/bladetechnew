-- Add label dimension columns to printer_settings table
ALTER TABLE public.printer_settings 
ADD COLUMN label_width_mm NUMERIC DEFAULT 101,
ADD COLUMN label_height_mm NUMERIC DEFAULT 101;