-- Update function to accept target rates as parameter
CREATE OR REPLACE FUNCTION public.calculate_daily_oee_summary(target_date DATE, target_rates JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    
    -- Process each activity type
    FOR activity_record IN 
        SELECT 
            CASE 
                WHEN key = 'Laser1' OR key = 'Laser2' OR key = 'Laser3' THEN key
                WHEN key = 'Welder' THEN 'Welder'
                ELSE 'Other'
            END as activity_type,
            SUM(
                CASE 
                    WHEN jsonb_typeof(activities.value) = 'array' THEN
                        (SELECT SUM((entry->>'UnitsProduced')::INTEGER) 
                         FROM jsonb_array_elements(activities.value) as entry)
                    ELSE 0
                END
            ) as total_units,
            SUM(
                CASE 
                    WHEN jsonb_typeof(activities.value) = 'array' THEN
                        (SELECT SUM(COALESCE((entry->>'TimeSpent')::NUMERIC, 0)) 
                         FROM jsonb_array_elements(activities.value) as entry)
                    ELSE 0
                END
            ) as total_time,
            SUM(
                CASE 
                    WHEN jsonb_typeof(activities.value) = 'array' THEN
                        (SELECT SUM(COALESCE((entry->>'Scrap')::INTEGER, 0)) 
                         FROM jsonb_array_elements(activities.value) as entry)
                    ELSE 0
                END
            ) as total_scrap,
            SUM(COALESCE((sr.production_data->>'hours_booked')::NUMERIC, 0)) as booked_hours
        FROM public.shift_records sr,
             jsonb_each(sr.production_data->'activities') as activities
        WHERE sr.shift_date = target_date
          AND sr.production_data IS NOT NULL
        GROUP BY 
            CASE 
                WHEN key = 'Laser1' OR key = 'Laser2' OR key = 'Laser3' THEN key
                WHEN key = 'Welder' THEN 'Welder'
                ELSE 'Other'
            END
        HAVING SUM(
            CASE 
                WHEN jsonb_typeof(activities.value) = 'array' THEN
                    (SELECT SUM((entry->>'UnitsProduced')::INTEGER) 
                     FROM jsonb_array_elements(activities.value) as entry)
                ELSE 0
            END
        ) > 0
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
        perf_booked := CASE WHEN (rate_booked * total_time) > 0 THEN (total_units::NUMERIC / (rate_booked * total_time)) * 100 ELSE 0 END;
        oee_booked_calc := (100 * perf_booked * quality_pct) / 10000;
        
        -- Insert summary
        INSERT INTO public.oee_daily_summary (
            calculation_date, activity_type, total_units, total_time, total_scrap, booked_hours,
            target_rate_247, target_rate_booked, availability_247, performance_247, quality, oee_247,
            availability_booked, performance_booked, oee_booked
        ) VALUES (
            target_date, activity_record.activity_type, total_units, total_time, total_scrap, booked_hours,
            rate_247, rate_booked, GREATEST(0, avail_247), GREATEST(0, perf_247), GREATEST(0, quality_pct), GREATEST(0, oee_247_calc),
            100, GREATEST(0, perf_booked), GREATEST(0, oee_booked_calc)
        );
    END LOOP;
END;
$function$;