-- Enable required extensions for scheduled tasks and HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a scheduled job to update timesheet tracking daily at 1 AM
SELECT cron.schedule(
  'update-timesheet-tracking-daily',
  '0 1 * * *', -- Daily at 1 AM
  $$
  SELECT
    net.http_post(
        url:='https://bujljvgiskdxzahztybs.supabase.co/functions/v1/update-timesheet-tracking',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amxqdmdpc2tkeHphaHp0eWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MzIwMjgsImV4cCI6MjA2NzIwODAyOH0.q8DoJodsYkiL4HGECfUQpQ1kmINy1e0SPX6bvjw9ht0"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Also run the update function immediately to populate historical data
SELECT
  net.http_post(
      url:='https://bujljvgiskdxzahztybs.supabase.co/functions/v1/update-timesheet-tracking',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amxqdmdpc2tkeHphaHp0eWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MzIwMjgsImV4cCI6MjA2NzIwODAyOH0.q8DoJodsYkiL4HGECfUQpQ1kmINy1e0SPX6bvjw9ht0"}'::jsonb,
      body:='{}'::jsonb
  ) as initial_request_id;