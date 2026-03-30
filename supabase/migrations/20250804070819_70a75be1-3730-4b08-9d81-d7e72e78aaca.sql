-- Update the calculate_daily_oee_summary function to work with the current data structure
CREATE OR REPLACE FUNCTION public.calculate_daily_oee_summary_new(target_date date, target_rates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_record RECORD;
    total_units INTEGER;
    total_time NUMERIC;
    total_scrap INTEGER;
    booked_hours NUMERIC;
    rate_247 NUMERIC;
    rate_booked NUMERIC;
    good_units INTEGER;
    quality_pct NUMERIC;
    avail_247 NUMERIC;
    perf_247 NUMERIC;
    oee_247_calc NUMERIC;
    perf_booked NUMERIC;
    oee_booked_calc NUMERIC;
BEGIN
    -- Delete existing summary for this date
    DELETE FROM public.oee_daily_summary WHERE calculation_date = target_date;
    
    -- Process each activity type from the new data structure
    FOR activity_record IN 
        SELECT 
            activity.value->>'name' as activity_type,
            SUM(COALESCE((entry->>'units_produced')::INTEGER, 0)) as total_units,
            SUM(COALESCE((entry->>'time_spent')::NUMERIC, 0)) as total_time,
            SUM(COALESCE((entry->>'scrap')::INTEGER, 0)) as total_scrap,
            SUM(COALESCE((sr.production_data->>'hours_booked')::NUMERIC, 0)) as booked_hours
        FROM public.shift_records sr,
             jsonb_array_elements(sr.production_data->'activities') as activity,
             jsonb_array_elements(activity.value->'entries') as entry
        WHERE sr.shift_date = target_date
          AND sr.production_data IS NOT NULL
          AND jsonb_array_length(activity.value->'entries') > 0
          AND entry->>'units_produced' IS NOT NULL
          AND (entry->>'units_produced')::INTEGER > 0
        GROUP BY activity.value->>'name'
    LOOP
        total_units := COALESCE(activity_record.total_units, 0);
        total_time := COALESCE(activity_record.total_time, 0);
        total_scrap := COALESCE(activity_record.total_scrap, 0);
        booked_hours := COALESCE(activity_record.booked_hours, 0);
        
        -- Get target rates from parameter
        rate_247 := COALESCE((target_rates->>activity_record.activity_type)::NUMERIC, 200);
        rate_booked := rate_247; -- Same rate for both calculations
        
        -- Calculate quality
        good_units := total_units - total_scrap;
        quality_pct := CASE WHEN total_units > 0 THEN (good_units::NUMERIC / total_units::NUMERIC) * 100 ELSE 100 END;
        
        -- Calculate 24/7 OEE (using 24 hours as theoretical capacity)
        avail_247 := CASE WHEN 24 > 0 THEN (booked_hours / 24) * 100 ELSE 100 END;
        perf_247 := CASE WHEN (rate_247 * 24) > 0 THEN (total_units::NUMERIC / (rate_247 * 24)) * 100 ELSE 0 END;
        oee_247_calc := (avail_247 * perf_247 * quality_pct) / 10000;
        
        -- Calculate booked time OEE
        perf_booked := CASE WHEN (rate_booked * total_time) > 0 AND total_time > 0 THEN (total_units::NUMERIC / (rate_booked * total_time)) * 100 ELSE 0 END;
        oee_booked_calc := (100 * perf_booked * quality_pct) / 10000;
        
        -- Insert summary
        INSERT INTO public.oee_daily_summary (
            calculation_date, activity_type, total_units, total_time, total_scrap, booked_hours,
            target_rate_247, target_rate_booked, availability_247, performance_247, quality, oee_247,
            availability_booked, performance_booked, oee_booked
        ) VALUES (
            target_date, activity_record.activity_type, total_units, total_time, total_scrap, booked_hours,
            rate_247, rate_booked, GREATEST(0, LEAST(100, avail_247)), GREATEST(0, LEAST(200, perf_247)), GREATEST(0, LEAST(100, quality_pct)), GREATEST(0, LEAST(100, oee_247_calc)),
            100, GREATEST(0, LEAST(200, perf_booked)), GREATEST(0, LEAST(100, oee_booked_calc))
        );
    END LOOP;
END;
$$;

-- Create a function to populate summaries for a date range
CREATE OR REPLACE FUNCTION public.populate_oee_summaries(start_date date, end_date date, target_rates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_date date := start_date;
BEGIN
    WHILE current_date <= end_date LOOP
        PERFORM public.calculate_daily_oee_summary_new(current_date, target_rates);
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END;
$$;