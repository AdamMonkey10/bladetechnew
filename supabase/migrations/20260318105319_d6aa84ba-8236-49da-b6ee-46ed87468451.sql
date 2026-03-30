DELETE FROM public.calibration_records
WHERE equipment_name = 'Laser 3'
  AND calibration_date IN ('2024-12-09', '2025-06-09');

INSERT INTO public.calibration_records
  (equipment_name, equipment_serial, calibration_date, next_calibration_date, status, notes, calibration_data)
VALUES
('Laser 3', 'BB0Q000034', '2025-02-17', '2025-08-18', 'active', 'Performed by Matt',
 '[{"label":"Width","value":"0.9866","unit":"inch"},{"label":"Height","value":"1.1839","unit":"inch"},{"label":"Angle","value":"45.1","unit":"deg"},{"label":"Circle 1","value":"0.1572","unit":"inch"},{"label":"Circle 2","value":"0.1574","unit":"inch"},{"label":"Circle 3","value":"0.1573","unit":"inch"},{"label":"Circle 4","value":"0.1572","unit":"inch"},{"label":"Arc Radius Right","value":"0.1961","unit":"inch"},{"label":"Arc Radius Left","value":"0.1972","unit":"inch"},{"label":"1-3","value":"0.5572","unit":"inch"},{"label":"2-4","value":"0.5573","unit":"inch"}]'::jsonb),
('Laser 3', 'BB0Q000034', '2025-08-18', '2026-02-16', 'active', 'Performed by Matt',
 '[{"label":"Width","value":"0.9866","unit":"inch"},{"label":"Height","value":"1.1838","unit":"inch"},{"label":"Angle","value":"45.1","unit":"deg"},{"label":"Circle 1","value":"0.1572","unit":"inch"},{"label":"Circle 2","value":"0.1574","unit":"inch"},{"label":"Circle 3","value":"0.1573","unit":"inch"},{"label":"Circle 4","value":"0.1572","unit":"inch"},{"label":"Arc Radius Right","value":"0.1960","unit":"inch"},{"label":"Arc Radius Left","value":"0.1971","unit":"inch"},{"label":"1-3","value":"0.5572","unit":"inch"},{"label":"2-4","value":"0.5572","unit":"inch"}]'::jsonb);