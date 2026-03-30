
CREATE TABLE public.registered_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fingerprint TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.registered_devices ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to read active devices for fingerprint checking
CREATE POLICY "anon_select_active" ON public.registered_devices
  FOR SELECT TO anon, authenticated
  USING (true);

-- Authenticated users can insert/update/delete (admin management)
CREATE POLICY "auth_manage" ON public.registered_devices
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
