-- Add template_name to customers table to support multiple templates per customer
ALTER TABLE public.customers 
ADD COLUMN template_name text DEFAULT 'Default Template';

-- Add customer_template_id to customer_pos table to link POs with specific customer templates
ALTER TABLE public.customer_pos 
ADD COLUMN customer_template_id uuid REFERENCES public.customers(id);

-- Create index for better performance on the new foreign key
CREATE INDEX idx_customer_pos_customer_template_id ON public.customer_pos(customer_template_id);

-- Update existing customers to have a proper template name
UPDATE public.customers 
SET template_name = customer_name || ' - Default' 
WHERE template_name = 'Default Template';