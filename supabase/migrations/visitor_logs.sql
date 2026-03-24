-- Create visitor_logs table for analytics
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address     text,
  user_agent     text,
  browser_name   text,
  os_name        text,
  device_type    text,
  device_model   text,
  platform       text,
  language       text,
  screen_width   int,
  screen_height  int,
  cpu_cores      int,
  ram_gb         int,
  referrer       text,
  created_at     timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous inserts
CREATE POLICY "Allow public insert visitor logs" 
ON public.visitor_logs 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow authenticated users to see logs for their own profile (optional, but useful)
-- For now, let's keep it restricted or allow the profile owner to see their counts
CREATE POLICY "Allow profile owners to view their own logs" 
ON public.visitor_logs 
FOR SELECT 
TO authenticated 
USING (profile_id = auth.uid());
