
-- providers vetting fields
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS clinic_address text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- vendors vetting fields
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- profiles soft-delete
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Admin update policies (admins already have read-all via existing policies)
DROP POLICY IF EXISTS "Admins update providers" ON public.providers;
CREATE POLICY "Admins update providers" ON public.providers
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update vendors" ON public.vendors;
CREATE POLICY "Admins update vendors" ON public.vendors
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Admin manage guidance content
DROP POLICY IF EXISTS "Admins insert guidance" ON public.guidance_content;
CREATE POLICY "Admins insert guidance" ON public.guidance_content
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update guidance" ON public.guidance_content;
CREATE POLICY "Admins update guidance" ON public.guidance_content
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete guidance" ON public.guidance_content;
CREATE POLICY "Admins delete guidance" ON public.guidance_content
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read all guidance" ON public.guidance_content;
CREATE POLICY "Admins read all guidance" ON public.guidance_content
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
