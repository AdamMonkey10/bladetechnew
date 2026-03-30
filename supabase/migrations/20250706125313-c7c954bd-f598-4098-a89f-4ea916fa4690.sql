-- Create function to fix missing hours in shift records
CREATE OR REPLACE FUNCTION public.fix_missing_hours()
RETURNS TABLE (
    record_id uuid,
    activity_type text,
    units_produced integer,
    original_hours numeric,
    estimated_hours numeric,
    corrected boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    shift_record RECORD;
    activity_record RECORD;
    avg_rates JSONB := '{
        "Laser1": 526.21,
        "Welder": 167.30,
        "Laser2": 400.0
    }';
    estimated_time numeric;
    updated_production_data jsonb;
    activity_array jsonb;
    updated_activity jsonb;
    correction_applied boolean := false;
BEGIN
    -- Loop through all shift records
    FOR shift_record IN 
        SELECT id, production_data 
        FROM public.shift_records 
        WHERE production_data IS NOT NULL
    LOOP
        updated_production_data := shift_record.production_data;
        correction_applied := false;
        
        -- Check each activity type in the production data
        FOR activity_record IN 
            SELECT key as activity_type, value as activities
            FROM jsonb_each(shift_record.production_data->'activities')
        LOOP
            -- Get the activities array for this activity type
            activity_array := activity_record.activities;
            
            -- Process each activity in the array
            FOR i IN 0..jsonb_array_length(activity_array) - 1
            LOOP
                -- Check if this activity has units but no time
                IF (activity_array->i->>'UnitsProduced')::numeric > 0 
                   AND COALESCE((activity_array->i->>'TimeSpent')::numeric, 0) = 0
                THEN
                    -- Calculate estimated time based on average rate
                    estimated_time := (activity_array->i->>'UnitsProduced')::numeric / 
                                    COALESCE((avg_rates->>activity_record.activity_type)::numeric, 200.0);
                    
                    -- Update the activity with estimated time
                    updated_activity := activity_array->i || jsonb_build_object('TimeSpent', estimated_time);
                    activity_array := jsonb_set(activity_array, ARRAY[i::text], updated_activity);
                    correction_applied := true;
                    
                    -- Return record of correction
                    record_id := shift_record.id;
                    activity_type := activity_record.activity_type;
                    units_produced := (activity_array->i->>'UnitsProduced')::integer;
                    original_hours := 0;
                    estimated_hours := estimated_time;
                    corrected := true;
                    RETURN NEXT;
                END IF;
            END LOOP;
            
            -- Update the activities array back into production data
            updated_production_data := jsonb_set(
                updated_production_data, 
                ARRAY['activities', activity_record.activity_type], 
                activity_array
            );
        END LOOP;
        
        -- Update the shift record if corrections were made
        IF correction_applied THEN
            UPDATE public.shift_records 
            SET production_data = updated_production_data,
                updated_at = now()
            WHERE id = shift_record.id;
        END IF;
    END LOOP;
END;
$$;

-- Create a function to get data quality metrics
CREATE OR REPLACE FUNCTION public.get_data_quality_metrics()
RETURNS TABLE (
    total_records integer,
    records_with_corrections integer,
    correction_percentage numeric,
    activities_corrected jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_count integer;
    corrected_count integer;
    correction_stats jsonb := '{}';
BEGIN
    -- Get total shift records
    SELECT COUNT(*) INTO total_count
    FROM public.shift_records
    WHERE production_data IS NOT NULL;
    
    -- Count records that would need corrections (simplified check)
    SELECT COUNT(DISTINCT sr.id) INTO corrected_count
    FROM public.shift_records sr,
         jsonb_each(sr.production_data->'activities') as activities,
         jsonb_array_elements(activities.value) as activity
    WHERE (activity->>'UnitsProduced')::numeric > 0 
      AND COALESCE((activity->>'TimeSpent')::numeric, 0) = 0;
    
    total_records := total_count;
    records_with_corrections := corrected_count;
    correction_percentage := CASE 
        WHEN total_count > 0 THEN (corrected_count::numeric / total_count::numeric) * 100 
        ELSE 0 
    END;
    activities_corrected := correction_stats;
    
    RETURN NEXT;
END;
$$;