
-- ============ seed_events ============
CREATE TABLE public.seed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  host_name TEXT,
  host_type TEXT,
  region TEXT,
  country TEXT,
  city TEXT,
  venue_name TEXT,
  location_type TEXT,
  date_time_local TEXT,
  date_status TEXT,
  timezone TEXT,
  price_type TEXT,
  price_amount NUMERIC,
  currency TEXT,
  languages TEXT,
  life_stage_tags TEXT,
  event_category_tags TEXT,
  short_description TEXT,
  long_description TEXT,
  speaker_slots TEXT,
  agenda TEXT,
  registration_type TEXT,
  registration_url TEXT,
  status TEXT NOT NULL,
  display_in_app BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT,
  source_url TEXT,
  notes TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seed_events TO authenticated, anon;
GRANT ALL ON public.seed_events TO service_role;
ALTER TABLE public.seed_events ENABLE ROW LEVEL SECURITY;
-- Mothers / public: only display-safe rows
CREATE POLICY "Public can read displayable events"
  ON public.seed_events FOR SELECT
  USING (
    display_in_app = true
    AND status IN ('eve_hosted','partner_hosted','verified','registration_confirmed')
  );
CREATE POLICY "Admins manage seed_events"
  ON public.seed_events FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_seed_events_updated
  BEFORE UPDATE ON public.seed_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ directory_resources ============
CREATE TABLE public.directory_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL DEFAULT 'directory',
  resource_name TEXT NOT NULL,
  category TEXT,
  region TEXT,
  country TEXT,
  city_scope TEXT,
  language_support TEXT,
  resource_type TEXT,
  display_section TEXT,
  display_in_app BOOLEAN NOT NULL DEFAULT true,
  source_status TEXT,
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.directory_resources TO authenticated, anon;
GRANT ALL ON public.directory_resources TO service_role;
ALTER TABLE public.directory_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read visible directories"
  ON public.directory_resources FOR SELECT
  USING (display_in_app = true);
CREATE POLICY "Admins manage directory_resources"
  ON public.directory_resources FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_directory_resources_updated
  BEFORE UPDATE ON public.directory_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ provider_targets (INTERNAL ONLY) ============
CREATE TABLE public.provider_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL DEFAULT 'provider_target',
  region TEXT,
  country TEXT,
  city TEXT,
  specialty TEXT,
  priority NUMERIC,
  target_count NUMERIC,
  display_in_app BOOLEAN NOT NULL DEFAULT false,
  status TEXT,
  recommended_source TEXT,
  source_url TEXT,
  language_focus TEXT,
  cultural_fit_tags TEXT,
  verification_tasks TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.provider_targets TO service_role;
ALTER TABLE public.provider_targets ENABLE ROW LEVEL SECURITY;
-- Admin only — no anon / authenticated read
CREATE POLICY "Admins manage provider_targets"
  ON public.provider_targets FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_provider_targets_updated
  BEFORE UPDATE ON public.provider_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ community_seeds ============
CREATE TABLE public.community_seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL DEFAULT 'community_seed',
  title TEXT NOT NULL,
  body_preview TEXT,
  category TEXT,
  life_stage TEXT,
  region_scope TEXT,
  country_scope TEXT,
  language TEXT,
  tags TEXT,
  safety_flag BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL,
  display_in_app BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_seeds TO authenticated, anon;
GRANT ALL ON public.community_seeds TO service_role;
ALTER TABLE public.community_seeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read safe community seeds"
  ON public.community_seeds FOR SELECT
  USING (
    display_in_app = true
    AND safety_flag = false
    AND status IN ('draft_seed','published_seed')
  );
CREATE POLICY "Admins manage community_seeds"
  ON public.community_seeds FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_community_seeds_updated
  BEFORE UPDATE ON public.community_seeds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
