-- Fix Jamie's orphan clock event from Nov 6 (no clock_out causing 802.1 hours)
-- Jamie's typical shift is ~12 hours, started at 06:03, so closing at 18:00

UPDATE clockfy_time_events
SET clock_out = '2025-11-06 18:00:00+00',
    total_hours = 11.94,
    updated_at = now()
WHERE id = '0380ef1f-aaaf-4126-9190-d92ef0b72193';