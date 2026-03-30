-- Add box_amount field to products table for label printing calculations
ALTER TABLE public.products 
ADD COLUMN box_amount INTEGER DEFAULT 100;