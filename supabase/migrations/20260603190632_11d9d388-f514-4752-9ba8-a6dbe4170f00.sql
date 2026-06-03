
CREATE TABLE public.vendor_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  content_type TEXT NOT NULL DEFAULT 'article',
  category TEXT,
  life_stage TEXT,
  related_service TEXT,
  language TEXT DEFAULT 'en',
  location TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  media_url TEXT,
  cta_type TEXT,
  cta_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  requires_review BOOLEAN NOT NULL DEFAULT false,
  event_at TIMESTAMPTZ,
  views INT NOT NULL DEFAULT 0,
  saves INT NOT NULL DEFAULT 0,
  profile_visits INT NOT NULL DEFAULT 0,
  booking_clicks INT NOT NULL DEFAULT 0,
  quote_requests INT NOT NULL DEFAULT 0,
  messages INT NOT NULL DEFAULT 0,
  event_registrations INT NOT NULL DEFAULT 0,
  shop_clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vendor_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_content TO authenticated;
GRANT ALL ON public.vendor_content TO service_role;

ALTER TABLE public.vendor_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published content is public"
  ON public.vendor_content FOR SELECT
  USING (status = 'published');

CREATE POLICY "Vendors can view own content"
  ON public.vendor_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

CREATE POLICY "Vendors can insert own content"
  ON public.vendor_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

CREATE POLICY "Vendors can update own content"
  ON public.vendor_content FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

CREATE POLICY "Vendors can delete own content"
  ON public.vendor_content FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

CREATE POLICY "Admins can update any content"
  ON public.vendor_content FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_vendor_content_updated_at
  BEFORE UPDATE ON public.vendor_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX vendor_content_vendor_id_idx ON public.vendor_content(vendor_id);
CREATE INDEX vendor_content_status_idx ON public.vendor_content(status);
CREATE INDEX vendor_content_life_stage_idx ON public.vendor_content(life_stage);
CREATE INDEX vendor_content_category_idx ON public.vendor_content(category);

CREATE TABLE public.vendor_content_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.vendor_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

GRANT SELECT, INSERT, DELETE ON public.vendor_content_saves TO authenticated;
GRANT ALL ON public.vendor_content_saves TO service_role;

ALTER TABLE public.vendor_content_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saves"
  ON public.vendor_content_saves FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
