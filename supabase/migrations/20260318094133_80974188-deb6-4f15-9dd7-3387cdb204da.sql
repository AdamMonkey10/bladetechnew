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
  NULL::uuid,
  v.equipment_name,
  NULL::text,
  v.calibration_date,
  v.next_calibration_date,
  'active',
  'Performed by Matt',
  v.calibration_data::jsonb,
  NULL::uuid
FROM (
  VALUES
    ('Laser 1'::text, '2024-06-17'::date, '2024-12-17'::date, '[{"label":"Width","value":"0.9863","unit":"inch"},{"label":"Height","value":"1.1835","unit":"inch"},{"label":"Angle","value":"45.0","unit":"deg"},{"label":"Circle 1","value":"0.1570","unit":"inch"},{"label":"Circle 2","value":"0.1572","unit":"inch"},{"label":"Circle 3","value":"0.1571","unit":"inch"},{"label":"Circle 4","value":"0.1570","unit":"inch"},{"label":"Arc Radius Right","value":"0.1958","unit":"inch"},{"label":"Arc Radius Left","value":"0.1969","unit":"inch"},{"label":"1-3","value":"0.5570","unit":"inch"},{"label":"2-4","value":"0.5570","unit":"inch"}]'::text),
    ('Laser 2'::text, '2024-06-17'::date, '2024-12-17'::date, '[{"label":"Width","value":"0.9866","unit":"inch"},{"label":"Height","value":"1.1838","unit":"inch"},{"label":"Angle","value":"45.1","unit":"deg"},{"label":"Circle 1","value":"0.1572","unit":"inch"},{"label":"Circle 2","value":"0.1574","unit":"inch"},{"label":"Circle 3","value":"0.1573","unit":"inch"},{"label":"Circle 4","value":"0.1572","unit":"inch"},{"label":"Arc Radius Right","value":"0.1960","unit":"inch"},{"label":"Arc Radius Left","value":"0.1971","unit":"inch"},{"label":"1-3","value":"0.5572","unit":"inch"},{"label":"2-4","value":"0.5572","unit":"inch"}]'::text),
    ('Laser 1'::text, '2024-12-09'::date, '2025-06-09'::date, '[{"label":"Width","value":"0.9864","unit":"inch"},{"label":"Height","value":"1.1836","unit":"inch"},{"label":"Angle","value":"45.0","unit":"deg"},{"label":"Circle 1","value":"0.1571","unit":"inch"},{"label":"Circle 2","value":"0.1573","unit":"inch"},{"label":"Circle 3","value":"0.1572","unit":"inch"},{"label":"Circle 4","value":"0.1571","unit":"inch"},{"label":"Arc Radius Right","value":"0.1959","unit":"inch"},{"label":"Arc Radius Left","value":"0.1970","unit":"inch"},{"label":"1-3","value":"0.5571","unit":"inch"},{"label":"2-4","value":"0.5571","unit":"inch"}]'::text),
    ('Laser 2'::text, '2024-12-09'::date, '2025-06-09'::date, '[{"label":"Width","value":"0.9865","unit":"inch"},{"label":"Height","value":"1.1837","unit":"inch"},{"label":"Angle","value":"45.0","unit":"deg"},{"label":"Circle 1","value":"0.1571","unit":"inch"},{"label":"Circle 2","value":"0.1572","unit":"inch"},{"label":"Circle 3","value":"0.1572","unit":"inch"},{"label":"Circle 4","value":"0.1570","unit":"inch"},{"label":"Arc Radius Right","value":"0.1958","unit":"inch"},{"label":"Arc Radius Left","value":"0.1969","unit":"inch"},{"label":"1-3","value":"0.5570","unit":"inch"},{"label":"2-4","value":"0.5571","unit":"inch"}]'::text),
    ('Laser 3'::text, '2024-12-09'::date, '2025-06-09'::date, '[{"label":"Width","value":"0.9864","unit":"inch"},{"label":"Height","value":"1.1835","unit":"inch"},{"label":"Angle","value":"44.9","unit":"deg"},{"label":"Circle 1","value":"0.1570","unit":"inch"},{"label":"Circle 2","value":"0.1572","unit":"inch"},{"label":"Circle 3","value":"0.1572","unit":"inch"},{"label":"Circle 4","value":"0.1570","unit":"inch"},{"label":"Arc Radius Right","value":"0.1957","unit":"inch"},{"label":"Arc Radius Left","value":"0.1968","unit":"inch"},{"label":"1-3","value":"0.5569","unit":"inch"},{"label":"2-4","value":"0.5570","unit":"inch"}]'::text),
    ('Laser 1'::text, '2025-06-09'::date, '2025-12-09'::date, '[{"label":"Width","value":"0.9865","unit":"inch"},{"label":"Height","value":"1.1837","unit":"inch"},{"label":"Angle","value":"45.0","unit":"deg"},{"label":"Circle 1","value":"0.1571","unit":"inch"},{"label":"Circle 2","value":"0.1573","unit":"inch"},{"label":"Circle 3","value":"0.1573","unit":"inch"},{"label":"Circle 4","value":"0.1571","unit":"inch"},{"label":"Arc Radius Right","value":"0.1959","unit":"inch"},{"label":"Arc Radius Left","value":"0.1970","unit":"inch"},{"label":"1-3","value":"0.5571","unit":"inch"},{"label":"2-4","value":"0.5571","unit":"inch"}]'::text),
    ('Laser 2'::text, '2025-06-09'::date, '2025-12-09'::date, '[{"label":"Width","value":"0.9864","unit":"inch"},{"label":"Height","value":"1.1836","unit":"inch"},{"label":"Angle","value":"45.0","unit":"deg"},{"label":"Circle 1","value":"0.1571","unit":"inch"},{"label":"Circle 2","value":"0.1573","unit":"inch"},{"label":"Circle 3","value":"0.1572","unit":"inch"},{"label":"Circle 4","value":"0.1571","unit":"inch"},{"label":"Arc Radius Right","value":"0.1959","unit":"inch"},{"label":"Arc Radius Left","value":"0.1970","unit":"inch"},{"label":"1-3","value":"0.5571","unit":"inch"},{"label":"2-4","value":"0.5570","unit":"inch"}]'::text),
    ('Laser 3'::text, '2025-06-09'::date, '2025-12-09'::date, '[{"label":"Width","value":"0.9866","unit":"inch"},{"label":"Height","value":"1.1839","unit":"inch"},{"label":"Angle","value":"45.1","unit":"deg"},{"label":"Circle 1","value":"0.1572","unit":"inch"},{"label":"Circle 2","value":"0.1574","unit":"inch"},{"label":"Circle 3","value":"0.1573","unit":"inch"},{"label":"Circle 4","value":"0.1572","unit":"inch"},{"label":"Arc Radius Right","value":"0.1961","unit":"inch"},{"label":"Arc Radius Left","value":"0.1972","unit":"inch"},{"label":"1-3","value":"0.5572","unit":"inch"},{"label":"2-4","value":"0.5573","unit":"inch"}]'::text),
    ('Laser 4'::text, '2025-06-09'::date, '2025-12-09'::date, '[{"label":"Width","value":"0.9865","unit":"inch"},{"label":"Height","value":"1.1837","unit":"inch"},{"label":"Angle","value":"45.0","unit":"deg"},{"label":"Circle 1","value":"0.1571","unit":"inch"},{"label":"Circle 2","value":"0.1573","unit":"inch"},{"label":"Circle 3","value":"0.1572","unit":"inch"},{"label":"Circle 4","value":"0.1571","unit":"inch"},{"label":"Arc Radius Right","value":"0.1959","unit":"inch"},{"label":"Arc Radius Left","value":"0.1970","unit":"inch"},{"label":"1-3","value":"0.5571","unit":"inch"},{"label":"2-4","value":"0.5571","unit":"inch"}]'::text)
) AS v(equipment_name, calibration_date, next_calibration_date, calibration_data)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.calibration_records existing
  WHERE existing.equipment_name = v.equipment_name
    AND existing.calibration_date = v.calibration_date
    AND existing.equipment_serial IS NOT DISTINCT FROM NULL::text
);