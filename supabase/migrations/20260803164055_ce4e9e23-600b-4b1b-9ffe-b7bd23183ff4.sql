DROP POLICY "Authors can create their own pending replies" ON public.community_replies;
DROP POLICY "Authors can edit their own replies before moderation decisions" ON public.community_replies;

DROP FUNCTION IF EXISTS public.is_provider_owner(uuid);

CREATE POLICY "Authors can create their own pending replies"
  ON public.community_replies FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'pending_review'
    AND is_seeded = false
    AND reply_type IN ('community','provider')
    AND (
      provider_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.providers pr
        WHERE pr.id = provider_id AND pr.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authors can edit their own replies before moderation decisions"
  ON public.community_replies FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status IN ('pending_review','published'))
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('pending_review','published')
    AND is_seeded = false
    AND (
      provider_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.providers pr
        WHERE pr.id = provider_id AND pr.user_id = auth.uid()
      )
    )
  );