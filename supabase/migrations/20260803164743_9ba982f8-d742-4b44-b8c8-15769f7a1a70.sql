-- Sprint 3A-2A: complete community data foundation (no policy changes)

-- Indexes (spec-aligned; existing ones kept)
CREATE INDEX IF NOT EXISTS idx_community_posts_category_created
  ON public.community_posts (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_created
  ON public.community_posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_replies_provider_created
  ON public.community_replies (provider_id, created_at DESC);

-- Ensure RLS remains enabled (no policies added in this sprint)
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- Documentation
COMMENT ON TABLE public.community_posts IS 'Member community posts. Moderation-gated: rows are only visible in product surfaces once status = published. Author identity must never be exposed in public UI.';
COMMENT ON COLUMN public.community_posts.status IS 'Moderation state; defaults to pending_review. One of pending_review, published, limited, removed, escalated.';
COMMENT ON COLUMN public.community_posts.is_seeded IS 'True for example/seeded content, false for real member content.';
COMMENT ON COLUMN public.community_posts.author_id IS 'Internal only. Never expose in public UI or API responses; use anonymous_alias instead.';
COMMENT ON COLUMN public.community_posts.visibility IS 'One of community, circle, private.';

COMMENT ON TABLE public.community_replies IS 'Replies to community posts. Moderation-gated: only status = published replies may be surfaced. Author identity must never be exposed in public UI.';
COMMENT ON COLUMN public.community_replies.status IS 'Moderation state; defaults to pending_review. One of pending_review, published, limited, removed, escalated.';
COMMENT ON COLUMN public.community_replies.is_seeded IS 'True for example/seeded content, false for real member content.';
COMMENT ON COLUMN public.community_replies.author_id IS 'Internal only. Never expose in public UI or API responses.';
COMMENT ON COLUMN public.community_replies.reply_type IS 'One of community, provider, moderator, system.';