-- Create printed_labels table for migrated Firebase LabelBoxes data
CREATE TABLE public.printed_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT, -- Original Firebase document ID for reference
  customer TEXT NOT NULL,
  po TEXT NOT NULL,
  sku TEXT NOT NULL,
  operator TEXT NOT NULL,
  laser TEXT NOT NULL,
  invoice TEXT,
  quantity INTEGER NOT NULL,
  pallet_id TEXT,
  pallet_name TEXT,
  print_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  firebase_created_at TIMESTAMP WITH TIME ZONE, -- Original Firebase timestamp
  user_id UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.printed_labels ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view all printed labels" 
ON public.printed_labels 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create printed labels" 
ON public.printed_labels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their printed labels" 
ON public.printed_labels 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their printed labels" 
ON public.printed_labels 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX idx_printed_labels_print_date ON public.printed_labels(print_date DESC);
CREATE INDEX idx_printed_labels_customer ON public.printed_labels(customer);
CREATE INDEX idx_printed_labels_po ON public.printed_labels(po);
CREATE INDEX idx_printed_labels_sku ON public.printed_labels(sku);
CREATE INDEX idx_printed_labels_document_id ON public.printed_labels(document_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_printed_labels_updated_at
BEFORE UPDATE ON public.printed_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();