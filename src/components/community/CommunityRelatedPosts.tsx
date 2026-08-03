import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { CATEGORIES, toneBadge, type Post } from "@/lib/community-seed";
import { cn } from "@/lib/utils";

/**
 * Other seeded threads in the same category. Plain category matching — no
 * fabricated similarity score and no invented timestamps.
 */
export function CommunityRelatedPosts({ posts }: { posts: Post[] }) {
  const { t } = useTranslation();
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-conversations" className="mt-6 rtl:text-right">
      <h2
        id="related-conversations"
        className="text-[13px] font-semibold uppercase tracking-wide text-eve-teal-dark/70"
      >
        {t("community.detail.related")}
      </h2>
      <ul className="mt-2 space-y-2">
        {posts.map((p) => {
          const cat = CATEGORIES.find((c) => c.key === p.category);
          return (
            <li key={p.id}>
              <Link
                to="/eve/community/post/$postId"
                params={{ postId: p.id }}
                onClick={() =>
                  track(ANALYTICS_EVENTS.communityPostOpened, {
                    post_id: p.id,
                    category: p.category,
                    source: "related_posts",
                  })
                }
                className="block rounded-2xl border border-eve-sand bg-white p-3 transition hover:bg-eve-cream/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
              >
                {cat && (
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[12px] font-medium",
                      toneBadge[cat.tone],
                    )}
                  >
                    {cat.label}
                  </span>
                )}
                <p className="mt-1 text-[14px] font-medium leading-snug text-eve-teal-dark">
                  {p.title}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
