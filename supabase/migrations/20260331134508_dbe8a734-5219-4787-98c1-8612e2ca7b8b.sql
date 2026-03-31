-- Fix 1: Add denormalized fields to label_printing_sessions
ALTER TABLE label_printing_sessions
  ADD COLUMN IF NOT EXISTS customer_name  text,
  ADD COLUMN IF NOT EXISTS po_number      text,
  ADD COLUMN IF NOT EXISTS operator_name  text,
  ADD COLUMN IF NOT EXISTS laser_name     text;

-- Fix 3: Add customer field to pallets
ALTER TABLE pallets
  ADD COLUMN IF NOT EXISTS customer text;