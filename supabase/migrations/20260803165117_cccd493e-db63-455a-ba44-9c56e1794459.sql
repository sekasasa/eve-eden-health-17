-- Sprint 3A-2B: tighten community RLS

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Published community posts are readable by signed-in users" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can read their own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can create their own pending posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can edit their own posts before moderation decisions" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can delete their own posts" ON public.community_posts;

DROP POLICY IF EXISTS "Published replies on published posts are readable" ON public.community_replies;
DROP POLICY IF EXISTS "Authors can read their own replies" ON public.community_replies;
DROP POLICY IF EXISTS "Authors can create their own pending replies" ON public.community_replies;
DROP POLICY IF EXISTS "Authors can edit their own replies before moderation decisions" ON public.community_replies;
DROP POLICY IF EXISTS "Authors can delete their own replies" ON public.community_replies;

-- 2. Moderation guard trigger
CREATE OR REPLACE FUNCTION public.community_guard_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  content_changed boolean := false;
BEGIN
  -- service_role / backend moderation bypasses these member rules
  IF auth.uid() IS NULL OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'author_id cannot be changed';
  END IF;

  IF OLD.is_seeded = false AND NEW.is_seeded = true THEN
    RAISE EXCEPTION 'is_seeded cannot be set by members';
  END IF;

  IF TG_TABLE_NAME = 'community_posts' THEN
    content_changed := (NEW.title, NEW.body, NEW.category, NEW.life_stage, NEW.city, NEW.country_code, NEW.language_code)
      IS DISTINCT FROM (OLD.title, OLD.body, OLD.category, OLD.life_stage, OLD.city, OLD.country_code, OLD.language_code);
    IF NEW.visibility IS DISTINCT FROM 'community' THEN
      RAISE EXCEPTION 'visibility must remain community';
    END IF;
  ELSE
    content_changed := NEW.body IS DISTINCT FROM OLD.body;
    IF NEW.provider_id IS NOT NULL THEN
      RAISE EXCEPTION 'provider_id cannot be set by members';
    END IF;
    IF NEW.reply_type IS DISTINCT FROM 'community' THEN
      RAISE EXCEPTION 'reply_type must remain community';
    END IF;
  END IF;

  IF content_changed THEN
    NEW.status := 'pending_review';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'status cannot be changed by members';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.community_guard_member_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_community_posts_member_guard ON public.community_posts;
CREATE TRIGGER trg_community_posts_member_guard
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_member_update();

DROP TRIGGER IF EXISTS trg_community_replies_member_guard ON public.community_replies;
CREATE TRIGGER trg_community_replies_member_guard
  BEFORE UPDATE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_member_update();

-- 3. community_posts policies
CREATE POLICY "community_posts_select_published"
  ON public.community_posts FOR SELECT TO authenticated
  USING (status = 'published' AND visibility = 'community');

CREATE POLICY "community_posts_select_own"
  ON public.community_posts FOR SELECT TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "community_posts_insert_own_pending"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'pending_review'
    AND is_seeded = false
    AND visibility = 'community'
  );

CREATE POLICY "community_posts_update_own"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    AND is_seeded = false
    AND status IN ('pending_review','published','limited')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND is_seeded = false
    AND visibility = 'community'
    AND status IN ('pending_review','published','limited')
  );

CREATE POLICY "community_posts_delete_own"
  ON public.community_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- 4. community_replies policies
CREATE POLICY "community_replies_select_published"
  ON public.community_replies FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = community_replies.post_id
        AND p.status = 'published'
        AND p.visibility = 'community'
    )
  );

CREATE POLICY "community_replies_select_own"
  ON public.community_replies FOR SELECT TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "community_replies_insert_own_pending"
  ON public.community_replies FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND provider_id IS NULL
    AND reply_type = 'community'
    AND status = 'pending_review'
    AND is_seeded = false
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = community_replies.post_id
        AND p.status = 'published'
        AND p.visibility = 'community'
    )
  );

CREATE POLICY "community_replies_update_own"
  ON public.community_replies FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    AND is_seeded = false
    AND provider_id IS NULL
    AND status IN ('pending_review','published','limited')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND is_seeded = false
    AND provider_id IS NULL
    AND reply_type = 'community'
    AND status IN ('pending_review','published','limited')
  );

CREATE POLICY "community_replies_delete_own"
  ON public.community_replies FOR DELETE TO authenticated
  USING (author_id = auth.uid());