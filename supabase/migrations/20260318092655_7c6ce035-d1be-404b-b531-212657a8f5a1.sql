WITH seed_rows (equipment_name, equipment_serial, calibration_date, next_calibration_date, status, notes, calibration_data, user_id) AS (
  VALUES
    (
      'Linear Vernier',
      'EG178',
      DATE '2025-07-14',
      DATE '2026-01-14',
      'active',
      'Performed by Matt',
      '[
        {"test":"Test 1","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"},
        {"test":"Test 2","level0":"","level025":"","level05":"","level075":"","level1":"","level2":"","level3":"","level6":""},
        {"test":"Test 3","level0":"","level025":"","level05":"","level075":"","level1":"","level2":"","level3":"","level6":""}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Micrometer',
      'M595',
      DATE '2025-07-14',
      DATE '2026-01-14',
      'active',
      'Performed by Matt',
      '[
        {"test":"Test 1","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"","level3":"","level6":""},
        {"test":"Test 2","level0":"0","level025":"0.25","level05":"0.5","level075":"0.7502","level1":"","level2":"","level3":"","level6":""},
        {"test":"Test 3","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"","level2":"","level3":"","level6":""}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Desk Set Checker',
      'DSC1',
      DATE '2025-07-14',
      DATE '2026-01-14',
      'active',
      'Performed by Matt',
      '[
        {"test":"Test 1","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"},
        {"test":"Test 2","level0":"","level025":"","level05":"","level075":"","level1":"","level2":"","level3":"","level6":""},
        {"test":"Test 3","level0":"","level025":"","level05":"","level075":"","level1":"","level2":"","level3":"","level6":""}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Set Checker',
      '20A-906',
      DATE '2025-07-14',
      DATE '2026-01-14',
      'active',
      'Performed by Matt',
      '[
        {"test":"Test 1","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"},
        {"test":"Test 2","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"},
        {"test":"Test 3","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Linear Vernier',
      'EG178',
      DATE '2026-01-12',
      DATE '2026-07-12',
      'active',
      'Performed by Matt',
      '[
        {"test":"Test 1","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"},
        {"test":"Test 2","level0":"","level025":"","level05":"","level075":"","level1":"","level2":"","level3":"","level6":""},
        {"test":"Test 3","level0":"","level025":"","level05":"","level075":"","level1":"","level2":"","level3":"","level6":""}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Micrometer',
      'M595',
      DATE '2026-01-12',
      DATE '2026-07-12',
      'active',
      'Performed by Matt',
      '[
        {"test":"Test 1","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"","level3":"","level6":""},
        {"test":"Test 2","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"","level2":"","level3":"","level6":""},
        {"test":"Test 3","level0":"0","level025":"0.25","level05":"0.5","level075":"0.7498","level1":"","level2":"","level3":"","level6":""}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Desk Set Checker',
      'DSC1',
      DATE '2026-01-12',
      DATE '2026-07-12',
      'active',
      'Performed by Matt',
      '[
        {"test":"Test 1","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"},
        {"test":"Test 2","level0":"","level025":"","level05":"","level075":"","level1":"","level2":"","level3":"","level6":""},
        {"test":"Test 3","level0":"","level025":"","level05":"","level075":"","level1":"","level2":"","level3":"","level6":""}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Set Checker',
      '20A-906',
      DATE '2026-01-12',
      DATE '2026-07-12',
      'active',
      'Performed by Matt',
      '[
        {"test":"Test 1","level0":"0","level025":"0.25","level05":"0.501","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"},
        {"test":"Test 2","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"},
        {"test":"Test 3","level0":"0","level025":"0.25","level05":"0.5","level075":"0.75","level1":"1","level2":"2","level3":"3","level6":"6"}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Laser 1',
      NULL,
      DATE '2025-12-08',
      DATE '2026-06-08',
      'active',
      'Performed by Matt',
      '[
        {"label":"Width","value":"0.9865","unit":"inch"},
        {"label":"Height","value":"1.1837","unit":"inch"},
        {"label":"Angle","value":"45.0","unit":"deg"},
        {"label":"Circle 1","value":"0.1571","unit":"inch"},
        {"label":"Circle 2","value":"0.1573","unit":"inch"},
        {"label":"Circle 3","value":"0.1573","unit":"inch"},
        {"label":"Circle 4","value":"0.1571","unit":"inch"},
        {"label":"Arc Radius Right","value":"0.1959","unit":"inch"},
        {"label":"Arc Radius Left","value":"0.1970","unit":"inch"},
        {"label":"1-3","value":"0.5571","unit":"inch"},
        {"label":"2-4","value":"0.5571","unit":"inch"}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Laser 2',
      NULL,
      DATE '2025-12-08',
      DATE '2026-06-08',
      'active',
      'Performed by Matt',
      '[
        {"label":"Width","value":"0.9864","unit":"inch"},
        {"label":"Height","value":"1.1836","unit":"inch"},
        {"label":"Angle","value":"45.0","unit":"deg"},
        {"label":"Circle 1","value":"0.1571","unit":"inch"},
        {"label":"Circle 2","value":"0.1572","unit":"inch"},
        {"label":"Circle 3","value":"0.1572","unit":"inch"},
        {"label":"Circle 4","value":"0.1570","unit":"inch"},
        {"label":"Arc Radius Right","value":"0.1958","unit":"inch"},
        {"label":"Arc Radius Left","value":"0.1969","unit":"inch"},
        {"label":"1-3","value":"0.5570","unit":"inch"},
        {"label":"2-4","value":"0.5571","unit":"inch"}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Laser 3',
      NULL,
      DATE '2025-12-08',
      DATE '2026-06-08',
      'active',
      'Performed by Matt',
      '[
        {"label":"Width","value":"0.9866","unit":"inch"},
        {"label":"Height","value":"1.1838","unit":"inch"},
        {"label":"Angle","value":"45.1","unit":"deg"},
        {"label":"Circle 1","value":"0.1572","unit":"inch"},
        {"label":"Circle 2","value":"0.1574","unit":"inch"},
        {"label":"Circle 3","value":"0.1573","unit":"inch"},
        {"label":"Circle 4","value":"0.1572","unit":"inch"},
        {"label":"Arc Radius Right","value":"0.1960","unit":"inch"},
        {"label":"Arc Radius Left","value":"0.1971","unit":"inch"},
        {"label":"1-3","value":"0.5572","unit":"inch"},
        {"label":"2-4","value":"0.5572","unit":"inch"}
      ]'::jsonb,
      NULL::uuid
    ),
    (
      'Laser 4',
      NULL,
      DATE '2025-12-08',
      DATE '2026-06-08',
      'active',
      'Performed by Matt',
      '[
        {"label":"Width","value":"0.9865","unit":"inch"},
        {"label":"Height","value":"1.1837","unit":"inch"},
        {"label":"Angle","value":"44.9","unit":"deg"},
        {"label":"Circle 1","value":"0.1570","unit":"inch"},
        {"label":"Circle 2","value":"0.1573","unit":"inch"},
        {"label":"Circle 3","value":"0.1572","unit":"inch"},
        {"label":"Circle 4","value":"0.1571","unit":"inch"},
        {"label":"Arc Radius Right","value":"0.1959","unit":"inch"},
        {"label":"Arc Radius Left","value":"0.1970","unit":"inch"},
        {"label":"1-3","value":"0.5571","unit":"inch"},
        {"label":"2-4","value":"0.5570","unit":"inch"}
      ]'::jsonb,
      NULL::uuid
    )
)
INSERT INTO public.calibration_records (
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
  s.equipment_name,
  s.equipment_serial,
  s.calibration_date,
  s.next_calibration_date,
  s.status,
  s.notes,
  s.calibration_data,
  s.user_id
FROM seed_rows s
WHERE NOT EXISTS (
  SELECT 1
  FROM public.calibration_records c
  WHERE c.equipment_name = s.equipment_name
    AND c.calibration_date = s.calibration_date
    AND c.equipment_serial IS NOT DISTINCT FROM s.equipment_serial
);