http://localhost:3000/admin/traffic
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create an admin view policy for profiles (Admins can see all profiles)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Update visitor_logs RLS to allow admins to see everything
DROP POLICY IF EXISTS "Admins can view all visitor logs" ON public.visitor_logs;
CREATE POLICY "Admins can view all visitor logs" 
ON public.visitor_logs 
FOR SELECT 
TO authenticated 
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
