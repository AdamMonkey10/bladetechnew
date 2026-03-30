-- Create OEE Daily Summary table for efficient time series queries
CREATE TABLE public.oee_daily_summary (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    calculation_date DATE NOT NULL,
    activity_type TEXT NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 0,
    total_time NUMERIC NOT NULL DEFAULT 0,
    total_scrap INTEGER NOT NULL DEFAULT 0,
    booked_hours NUMERIC NOT NULL DEFAULT 0,
    target_rate_247 NUMERIC NOT NULL DEFAULT 200,
    target_rate_booked NUMERIC NOT NULL DEFAULT 200,
    availability_247 NUMERIC NOT NULL DEFAULT 0,
    performance_247 NUMERIC NOT NULL DEFAULT 0,
    quality NUMERIC NOT NULL DEFAULT 100,
    oee_247 NUMERIC NOT NULL DEFAULT 0,
    availability_booked NUMERIC NOT NULL DEFAULT 100,
    performance_booked NUMERIC NOT NULL DEFAULT 0,
    oee_booked NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate entries
ALTER TABLE public.oee_daily_summary 
ADD CONSTRAINT unique_date_activity UNIQUE (calculation_date, activity_type);

-- Create indexes for better query performance
CREATE INDEX idx_oee_daily_summary_date ON public.oee_daily_summary(calculation_date);
CREATE INDEX idx_oee_daily_summary_activity ON public.oee_daily_summary(activity_type);
CREATE INDEX idx_oee_daily_summary_date_activity ON public.oee_daily_summary(calculation_date, activity_type);

-- Enable Row Level Security
ALTER TABLE public.oee_daily_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users
CREATE POLICY "Authenticated users can view OEE daily summary" 
ON public.oee_daily_summary 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create OEE daily summary" 
ON public.oee_daily_summary 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update OEE daily summary" 
ON public.oee_daily_summary 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_oee_daily_summary_updated_at
    BEFORE UPDATE ON public.oee_daily_summary
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();