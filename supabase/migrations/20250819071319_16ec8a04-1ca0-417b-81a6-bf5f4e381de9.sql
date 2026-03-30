-- Create equipment table for managing calibration equipment
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_name TEXT NOT NULL,
  equipment_serial TEXT,
  equipment_type TEXT,
  manufacturer TEXT,
  model TEXT,
  calibration_frequency_months INTEGER DEFAULT 6,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'retired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view all equipment" 
ON public.equipment 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create equipment" 
ON public.equipment 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update equipment" 
ON public.equipment 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Add trigger for updated_at
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key to calibration_records to link to equipment
ALTER TABLE public.calibration_records 
ADD COLUMN equipment_id UUID REFERENCES public.equipment(id);

-- Create index for better performance
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_equipment_name ON public.equipment(equipment_name);
CREATE INDEX idx_calibration_records_equipment_id ON public.calibration_records(equipment_id);