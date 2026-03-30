DO $$
DECLARE
  probe_equipment_id uuid;
  target_user uuid := '8e0db6e8-f8a3-45f0-890b-f13590d185e1'::uuid;
BEGIN
  SELECT id
  INTO probe_equipment_id
  FROM public.equipment
  WHERE equipment_name = 'Probe'
    AND manufacturer = 'Keyence'
    AND model = 'GT2-CH2M'
  LIMIT 1;

  IF probe_equipment_id IS NULL THEN
    INSERT INTO public.equipment (
      equipment_name,
      equipment_serial,
      equipment_type,
      manufacturer,
      model,
      calibration_frequency_months,
      status,
      notes,
      created_by
    ) VALUES (
      'Probe',
      NULL,
      'Contact Sensor',
      'Keyence',
      'GT2-CH2M',
      6,
      'active',
      'GT2 Digital Contact Sensor Head. PO00561. Cable: GT2-CA2M.',
      target_user
    )
    RETURNING id INTO probe_equipment_id;
  END IF;

  INSERT INTO public.calibration_records (
    equipment_id,
    equipment_name,
    equipment_serial,
    calibration_date,
    next_calibration_date,
    status,
    notes,
    calibration_data,
    user_id
  )
  SELECT
    probe_equipment_id,
    'Probe',
    NULL,
    '2025-06-23'::date,
    '2025-12-08'::date,
    'active',
    'Performed by Matt',
    '[{"label":"Check 1","value":"0","unit":"mm"},{"label":"Check 2","value":"0","unit":"mm"},{"label":"Check 3","value":"0","unit":"mm"}]'::jsonb,
    target_user
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.calibration_records
    WHERE equipment_name = 'Probe'
      AND calibration_date = '2025-06-23'::date
  );

  INSERT INTO public.calibration_records (
    equipment_id,
    equipment_name,
    equipment_serial,
    calibration_date,
    next_calibration_date,
    status,
    notes,
    calibration_data,
    user_id
  )
  SELECT
    probe_equipment_id,
    'Probe',
    NULL,
    '2025-12-08'::date,
    '2026-06-08'::date,
    'active',
    'Performed by Matt',
    '[{"label":"Check 1","value":"0","unit":"mm"},{"label":"Check 2","value":"0","unit":"mm"},{"label":"Check 3","value":"0","unit":"mm"}]'::jsonb,
    target_user
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.calibration_records
    WHERE equipment_name = 'Probe'
      AND calibration_date = '2025-12-08'::date
  );
END $$;