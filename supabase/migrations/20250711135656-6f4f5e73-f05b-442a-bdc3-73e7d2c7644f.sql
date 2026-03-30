-- Create archive table with identical structure to shift_records
CREATE TABLE public.archive_shift_records (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    end_time timestamp with time zone NULL,
    start_time timestamp with time zone NULL,
    user_id uuid NULL,
    notes text NULL,
    shift_type text NOT NULL,
    production_data jsonb NULL,
    shift_date date NOT NULL,
    machine_id uuid NULL,
    operator_id uuid NULL,
    -- Archive metadata
    archived_at timestamp with time zone NOT NULL DEFAULT now(),
    archived_by uuid NULL DEFAULT auth.uid(),
    CONSTRAINT archive_shift_records_pkey PRIMARY KEY (id)
);

-- Enable RLS on archive table
ALTER TABLE public.archive_shift_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for archive table
CREATE POLICY "Authenticated users can view archived shift records" 
ON public.archive_shift_records 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Insert historical data into archive table (pre-July 4th, 2025)
INSERT INTO public.archive_shift_records (
    id, created_at, end_time, start_time, user_id, notes, 
    shift_type, production_data, shift_date, machine_id, operator_id
)
SELECT 
    id, created_at, end_time, start_time, user_id, notes,
    shift_type, production_data, shift_date, machine_id, operator_id
FROM public.shift_records 
WHERE shift_date < '2025-07-04';

-- Delete archived records from active table
DELETE FROM public.shift_records 
WHERE shift_date < '2025-07-04';