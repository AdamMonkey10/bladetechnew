-- Create aggregated analytics view for better performance
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
  sr.operator_id,
  o.operator_name,
  o.operator_code,
  DATE_TRUNC('day', sr.shift_date) as date,
  COUNT(*) as total_shifts,
  
  -- Aggregate laser activities
  COALESCE(SUM(
    CASE 
      WHEN activity.value->>'name' ILIKE '%laser%' 
      THEN (
        SELECT SUM((entry->>'units_produced')::numeric) 
        FROM jsonb_array_elements(activity.value->'entries') as entry
      )
      ELSE 0 
    END
  ), 0) as laser_units,
  
  COALESCE(SUM(
    CASE 
      WHEN activity.value->>'name' ILIKE '%laser%' 
      THEN (
        SELECT SUM((entry->>'time_spent')::numeric) 
        FROM jsonb_array_elements(activity.value->'entries') as entry
      )
      ELSE 0 
    END
  ), 0) as laser_time,
  
  -- Aggregate welder activities
  COALESCE(SUM(
    CASE 
      WHEN activity.value->>'name' ILIKE '%weld%' 
      THEN (
        SELECT SUM((entry->>'units_produced')::numeric) 
        FROM jsonb_array_elements(activity.value->'entries') as entry
      )
      ELSE 0 
    END
  ), 0) as welder_units,
  
  COALESCE(SUM(
    CASE 
      WHEN activity.value->>'name' ILIKE '%weld%' 
      THEN (
        SELECT SUM((entry->>'time_spent')::numeric) 
        FROM jsonb_array_elements(activity.value->'entries') as entry
      )
      ELSE 0 
    END
  ), 0) as welder_time,
  
  -- Total metrics
  COALESCE(SUM(
    (
      SELECT SUM((entry->>'units_produced')::numeric) 
      FROM jsonb_array_elements(activity.value->'entries') as entry
    )
  ), 0) as total_units,
  
  COALESCE(SUM(
    (
      SELECT SUM((entry->>'time_spent')::numeric) 
      FROM jsonb_array_elements(activity.value->'entries') as entry
    )
  ), 0) as total_time,
  
  COALESCE(SUM(
    (
      SELECT SUM((entry->>'scrap')::numeric) 
      FROM jsonb_array_elements(activity.value->'entries') as entry
    )
  ), 0) as total_scrap

FROM public.shift_records sr
LEFT JOIN public.operators o ON sr.operator_id = o.id
CROSS JOIN jsonb_array_elements(sr.production_data->'activities') as activity
WHERE sr.production_data IS NOT NULL 
  AND sr.production_data->'activities' IS NOT NULL
  AND sr.shift_date >= '2025-07-07'
GROUP BY sr.operator_id, o.operator_name, o.operator_code, DATE_TRUNC('day', sr.shift_date);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_summary_operator_date 
ON public.shift_records(operator_id, shift_date) 
WHERE production_data IS NOT NULL;