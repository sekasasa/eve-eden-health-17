-- 1. SECURITY DEFINER function exposure
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_vendor_owner(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vendor_owner(uuid) TO authenticated;

-- Only allow self-scoped admin checks so signed-in users cannot probe others
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = _user_id AND user_type = 'admin'
     );
$$;

-- 2. Provider / vendor contact detail exposure (column-level)
REVOKE SELECT (phone, email, license_number, clinic_address) ON public.providers FROM anon, authenticated;
REVOKE SELECT (phone, email, address) ON public.vendors FROM anon, authenticated;

-- Admin-only full provider access
CREATE OR REPLACE FUNCTION public.admin_list_providers()
RETURNS SETOF public.providers
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.providers ORDER BY created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_providers() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_list_providers() TO authenticated;

-- 3. Storage: stop broad listing of the product-images bucket
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;

CREATE POLICY "Vendors list own product images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins list product images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

-- 4. chw_mothers: ensure no anon access and keep owner/admin only
REVOKE ALL ON public.chw_mothers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chw_mothers TO authenticated;
GRANT ALL ON public.chw_mothers TO service_role;