
-- Create backup_logs table
CREATE TABLE public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_date DATE NOT NULL,
  file_path TEXT,
  github_url TEXT,
  file_size_bytes BIGINT,
  tables_included JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  action_type TEXT NOT NULL DEFAULT 'backup',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read logs
CREATE POLICY "Authenticated users can read backup logs"
  ON public.backup_logs FOR SELECT TO authenticated USING (true);

-- Service role can do everything (edge functions use service role)
-- No policy needed for service role as it bypasses RLS

-- Create private backups storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false);

-- Storage policy: authenticated users can read from backups bucket
CREATE POLICY "Authenticated users can read backups"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'backups');
