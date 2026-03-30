-- Create table for persistent label printing sessions
CREATE TABLE public.label_printing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  laser_machine_id UUID NOT NULL,
  customer_po_id UUID,
  sku TEXT,
  quantity INTEGER,
  invoice TEXT,
  operator_id UUID,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, laser_machine_id, session_date)
);

-- Enable Row Level Security
ALTER TABLE public.label_printing_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own sessions" 
ON public.label_printing_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.label_printing_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.label_printing_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.label_printing_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.label_printing_sessions 
ADD CONSTRAINT fk_laser_machine 
FOREIGN KEY (laser_machine_id) REFERENCES public.machines(id);

ALTER TABLE public.label_printing_sessions 
ADD CONSTRAINT fk_customer_po 
FOREIGN KEY (customer_po_id) REFERENCES public.customer_pos(id);

ALTER TABLE public.label_printing_sessions 
ADD CONSTRAINT fk_operator 
FOREIGN KEY (operator_id) REFERENCES public.operators(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_label_printing_sessions_updated_at
BEFORE UPDATE ON public.label_printing_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();