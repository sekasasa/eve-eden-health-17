CREATE OR REPLACE FUNCTION public.is_provider_owner(_provider_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.providers
    WHERE id = _provider_id AND user_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_provider_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_provider_owner(uuid) TO authenticated, service_role;

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_alias text,
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL,
  life_stage text,
  city text,
  country_code text,
  language_code text,
  visibility text NOT NULL DEFAULT 'community',
  status text NOT NULL DEFAULT 'pending_review',
  is_anonymous boolean NOT NULL DEFAULT true,
  is_seeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_posts_status_check CHECK (status IN ('pending_review','published','limited','removed','escalated')),
  CONSTRAINT community_posts_visibility_check CHECK (visibility IN ('community','circle','private')),
  CONSTRAINT community_posts_title_len CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT community_posts_body_len CHECK (char_length(body) BETWEEN 1 AND 8000)
);

CREATE TABLE public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  body text NOT NULL,
  reply_type text NOT NULL DEFAULT 'community',
  status text NOT NULL DEFAULT 'pending_review',
  is_seeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_replies_status_check CHECK (status IN ('pending_review','published','limited','removed','escalated')),
  CONSTRAINT community_replies_type_check CHECK (reply_type IN ('community','provider','moderator','system')),
  CONSTRAINT community_replies_body_len CHECK (char_length(body) BETWEEN 1 AND 8000)
);

CREATE INDEX idx_community_posts_feed ON public.community_posts (status, visibility, created_at DESC);
CREATE INDEX idx_community_posts_category ON public.community_posts (category);
CREATE INDEX idx_community_posts_author ON public.community_posts (author_id);
CREATE INDEX idx_community_replies_post ON public.community_replies (post_id, status, created_at);
CREATE INDEX idx_community_replies_author ON public.community_replies (author_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_replies TO authenticated;
GRANT ALL ON public.community_replies TO service_role;

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published community posts are readable by signed-in users"
  ON public.community_posts FOR SELECT TO authenticated
  USING (status = 'published' AND visibility = 'community');

CREATE POLICY "Authors can read their own posts"
  ON public.community_posts FOR SELECT TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authors can create their own pending posts"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'pending_review'
    AND is_seeded = false
    AND visibility IN ('community','private')
  );

CREATE POLICY "Authors can edit their own posts before moderation decisions"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status IN ('pending_review','published'))
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('pending_review','published')
    AND is_seeded = false
  );

CREATE POLICY "Authors can delete their own posts"
  ON public.community_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Published replies on published posts are readable"
  ON public.community_replies FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_id AND p.status = 'published' AND p.visibility = 'community'
    )
  );

CREATE POLICY "Authors can read their own replies"
  ON public.community_replies FOR SELECT TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authors can create their own pending replies"
  ON public.community_replies FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'pending_review'
    AND is_seeded = false
    AND reply_type IN ('community','provider')
    AND (provider_id IS NULL OR public.is_provider_owner(provider_id))
  );

CREATE POLICY "Authors can edit their own replies before moderation decisions"
  ON public.community_replies FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status IN ('pending_review','published'))
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('pending_review','published')
    AND is_seeded = false
    AND (provider_id IS NULL OR public.is_provider_owner(provider_id))
  );

CREATE POLICY "Authors can delete their own replies"
  ON public.community_replies FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE TRIGGER trg_community_posts_updated
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_community_replies_updated
  BEFORE UPDATE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();