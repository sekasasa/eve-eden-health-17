CREATE TABLE IF NOT EXISTS public.community_circles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  circle_type text not null,
  visibility text not null default 'public',
  country_code text,
  city text,
  language_code text,
  life_stage text,
  topic_category text,
  is_curated boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.community_circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  unique (circle_id, user_id)
);

DO $$ BEGIN
  ALTER TABLE public.community_circles ADD CONSTRAINT community_circles_type_chk
    CHECK (circle_type IN ('location','life_stage','experience','culture_language','topic'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.community_circles ADD CONSTRAINT community_circles_visibility_chk
    CHECK (visibility IN ('public','request_to_join','private'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.community_circles ADD CONSTRAINT community_circles_status_chk
    CHECK (status IN ('active','archived','hidden'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.community_circle_members ADD CONSTRAINT community_circle_members_role_chk
    CHECK (role IN ('member','moderator','expert'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.community_circle_members ADD CONSTRAINT community_circle_members_status_chk
    CHECK (status IN ('active','pending','removed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_circles_status_visibility_created
  ON public.community_circles (status, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_circles_country_city
  ON public.community_circles (country_code, city);
CREATE INDEX IF NOT EXISTS idx_circles_life_stage ON public.community_circles (life_stage);
CREATE INDEX IF NOT EXISTS idx_circles_topic_category ON public.community_circles (topic_category);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_status
  ON public.community_circle_members (user_id, status);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle_status
  ON public.community_circle_members (circle_id, status);

GRANT SELECT ON public.community_circles TO authenticated;
GRANT ALL ON public.community_circles TO service_role;
GRANT SELECT, INSERT, DELETE ON public.community_circle_members TO authenticated;
GRANT ALL ON public.community_circle_members TO service_role;

DROP TRIGGER IF EXISTS update_community_circles_updated_at ON public.community_circles;
CREATE TRIGGER update_community_circles_updated_at
  BEFORE UPDATE ON public.community_circles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.community_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_circle_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "circles_select_public_active" ON public.community_circles;
CREATE POLICY "circles_select_public_active" ON public.community_circles
  FOR SELECT TO authenticated
  USING (status = 'active' AND visibility = 'public');

DROP POLICY IF EXISTS "circle_members_select_own" ON public.community_circle_members;
CREATE POLICY "circle_members_select_own" ON public.community_circle_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "circle_members_insert_own" ON public.community_circle_members;
CREATE POLICY "circle_members_insert_own" ON public.community_circle_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.community_circles c
      WHERE c.id = circle_id AND c.status = 'active' AND c.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS "circle_members_delete_own" ON public.community_circle_members;
CREATE POLICY "circle_members_delete_own" ON public.community_circle_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.community_circles IS 'Curated pilot circles. Created by staff/migrations only; no client write policies.';
COMMENT ON TABLE public.community_circle_members IS 'Self-service membership. user_id of other members is never exposed to clients.';

INSERT INTO public.community_circles (slug, name, description, circle_type, country_code, city, language_code, life_stage, topic_category)
VALUES
  ('casablanca-first-time-mothers','Casablanca first-time mothers','A curated space for first-time mothers in Casablanca to follow questions and answers about local care.','location','MA','Casablanca','fr','pregnancy',NULL),
  ('rabat-pregnancy-circle','Rabat pregnancy circle','A curated space for pregnancy questions and local care information in Rabat.','location','MA','Rabat','fr','pregnancy',NULL),
  ('trying-to-conceive-morocco','Trying to conceive — Morocco','A curated space about fertility, cycles, and finding fertility care in Morocco.','life_stage','MA',NULL,NULL,'fertility','fertility'),
  ('postpartum-support','Postpartum support','A curated space about recovery, feeding, sleep, and emotional health after birth.','life_stage',NULL,NULL,NULL,'postpartum','postpartum'),
  ('pregnancy-after-loss','Pregnancy after loss','A curated, gentle space for people navigating pregnancy after a loss.','experience',NULL,NULL,NULL,NULL,'loss'),
  ('darija-speaking-mothers','Darija-speaking mothers','A curated space for mothers who prefer Darija when discussing care.','culture_language','MA',NULL,'ary',NULL,NULL),
  ('ramadan-and-pregnancy','Ramadan and pregnancy','A curated space about fasting questions, nutrition, and care during Ramadan.','culture_language',NULL,NULL,NULL,NULL,'nutrition'),
  ('c-section-recovery','C-section recovery','A curated space about recovery after a caesarean birth.','experience',NULL,NULL,NULL,'postpartum','recovery')
ON CONFLICT (slug) DO NOTHING;