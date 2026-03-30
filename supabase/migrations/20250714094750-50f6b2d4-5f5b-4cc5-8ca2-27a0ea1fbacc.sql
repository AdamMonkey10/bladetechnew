-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  logo_position JSONB DEFAULT '{"x": 5, "y": 5, "width": 48, "height": 16}'::jsonb,
  zpl_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view customers" 
ON public.customers 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" 
ON public.customers 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create storage bucket for customer logos
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-logos', 'customer-logos', true);

-- Create storage policies
CREATE POLICY "Customer logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-logos');

CREATE POLICY "Authenticated users can upload customer logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'customer-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customer logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'customer-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customer logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'customer-logos' AND auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();