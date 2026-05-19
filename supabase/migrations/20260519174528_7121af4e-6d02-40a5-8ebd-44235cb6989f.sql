-- Helper to check if current user is an admin (avoids recursive RLS on profiles)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND user_type = 'admin'
  );
$$;

-- Admin read policies for program-level dashboards
CREATE POLICY "Admins read all chw_mothers"
ON public.chw_mothers FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all visits"
ON public.visits FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all chw_alerts"
ON public.chw_alerts FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update chw_alerts"
ON public.chw_alerts FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all mothers"
ON public.mothers FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all providers"
ON public.providers FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all appointments"
ON public.appointments FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));
