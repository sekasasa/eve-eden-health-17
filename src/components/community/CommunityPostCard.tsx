import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Bookmark, Flag, Flame, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { CommunityCareAction } from "@/components/community/CommunityCareAction";
import { CATEGORIES, toneBadge, type Post } from "@/lib/community-seed";

/** One seeded community thread. Always labelled as sample content. */
export function CommunityPostCard({
  post,
  hearted,
  saved,
  onHeart,
  onSave,
  onReport,
}: {
  post: Post;
  hearted: boolean;
  saved: boolean;
  onHeart: () => void;
  onSave: () => void;
  onReport: () => void;
}) {
  const { t } = useTranslation();
  const cat = CATEGORIES.find((c) => c.key === post.category);

  return (
    <article className="relative overflow-hidden rounded-2xl bg-eve-cream p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md rtl:text-right">
      <span className="absolute inset-y-0 start-0 w-[3px] bg-eve-teal" />

      <div className="flex items-center gap-2 rtl:flex-row-reverse">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
            post.avatarColor,
          )}
        >
          {post.avatarLetter}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-eve-teal-dark">{post.anonName}</p>
          <p className="text-[12px] text-eve-teal-dark/70">{post.timeAgo}</p>
        </div>
        <span className="shrink-0 rounded-full border border-eve-sand bg-white px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-eve-teal-dark/70">
          {t("community.sample")}
        </span>
        {post.trending && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-eve-terra-light px-2 py-0.5 text-[12px] font-semibold text-eve-terra">
            <Flame className="h-3 w-3" /> {t("community.trending")}
          </span>
        )}
      </div>

      {cat && (
        <span
          className={cn(
            "mt-3 inline-block rounded-full px-2 py-0.5 text-[12px] font-medium",
            toneBadge[cat.tone],
          )}
        >
          {cat.label}
        </span>
      )}

      <h2 className="mt-2 font-serif text-[18px] font-semibold leading-snug text-eve-teal-dark">
        <Link
          to="/eve/community/post/$postId"
          params={{ postId: post.id }}
          onClick={() =>
            track(ANALYTICS_EVENTS.communityPostOpened, {
              post_id: post.id,
              category: post.category,
              source: "community_feed",
            })
          }
          className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
        >
          {post.title}
        </Link>
      </h2>
      <p className="mt-1 text-[14px] leading-relaxed text-eve-teal-dark/80">{post.body}</p>

      <Link
        to="/eve/community/post/$postId"
        params={{ postId: post.id }}
        onClick={() =>
          track(ANALYTICS_EVENTS.communityPostOpened, {
            post_id: post.id,
            category: post.category,
            source: "community_feed",
          })
        }
        className="mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-eve-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
      >
        {t("community.detail.open")}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
      </Link>


      <div className="mt-3 flex items-center gap-4 border-t border-eve-sand pt-3 text-[13px] text-eve-teal-dark/75 rtl:flex-row-reverse">
        <button
          type="button"
          onClick={onHeart}
          aria-pressed={hearted}
          aria-label={t("community.heart")}
          className={cn(
            "inline-flex min-h-11 items-center gap-1 transition active:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal",
            hearted && "text-eve-rose",
          )}
        >
          <Heart className={cn("h-4 w-4", hearted && "fill-current")} />
          {post.hearts + (hearted ? 1 : 0)}
        </button>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          {post.replies}
        </span>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={t("community.save")}
          className={cn(
            "ms-auto inline-flex min-h-11 items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal",
            saved && "text-eve-teal",
          )}
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        </button>
        <button
          type="button"
          aria-label={t("community.report")}
          onClick={onReport}
          className="inline-flex min-h-11 items-center gap-1 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal"
        >
          <Flag className="h-3.5 w-3.5" />
          <span className="text-[13px]">{t("community.report")}</span>
        </button>
      </div>

      {post.topAnswer && (
        <div className="mt-3 border-t border-eve-sand pt-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-eve-teal">
            {t("community.topAnswer")}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-eve-teal-dark/80">
            {post.topAnswer}
          </p>
          <p className="mt-1 text-[12px] text-eve-teal-dark/60">
            {t("community.topAnswerSample")}
          </p>
        </div>
      )}

      <CommunityCareAction category={post.category} />
    </article>
  );
}
