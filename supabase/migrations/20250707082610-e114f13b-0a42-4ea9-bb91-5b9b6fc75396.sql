-- Create printer settings table
CREATE TABLE public.printer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL DEFAULT '10.0.0.14',
  port INTEGER NOT NULL DEFAULT 443,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their printer settings" 
ON public.printer_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their printer settings" 
ON public.printer_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their printer settings" 
ON public.printer_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_printer_settings_updated_at
BEFORE UPDATE ON public.printer_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for current users
INSERT INTO public.printer_settings (ip_address, port, user_id)
SELECT '10.0.0.14', 443, auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;