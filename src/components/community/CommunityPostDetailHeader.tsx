import { useTranslation } from "react-i18next";
import { Bookmark, Flag, Flame, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, toneBadge, type Post } from "@/lib/community-seed";

/**
 * Identity + metadata + local-only actions for one seeded thread.
 * Mirrors the feed card labels exactly — nothing here claims real membership.
 */
export function CommunityPostDetailHeader({
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
  const showMetrics = post.metricsAvailable !== false && !post.persisted;

  return (
    <header className="rtl:text-right">
      <div className="flex items-center gap-2 rtl:flex-row-reverse">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white",
            post.avatarColor,
          )}
        >
          {post.avatarLetter}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-eve-teal-dark">{post.anonName}</p>
          <p className="text-[12px] text-eve-teal-dark/70">{post.timeAgo}</p>
        </div>
        {!post.persisted && (
          <span className="shrink-0 rounded-full border border-eve-sand bg-white px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-eve-teal-dark/70">
            {t("community.sample")}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
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
        {showMetrics && post.trending && (
          <span className="inline-flex items-center gap-1 rounded-full bg-eve-terra-light px-2 py-0.5 text-[12px] font-semibold text-eve-terra">
            <Flame className="h-3 w-3" aria-hidden="true" /> {t("community.trending")}
          </span>
        )}
      </div>

      <h1 className="mt-2 font-serif text-[20px] font-semibold leading-snug text-eve-teal-dark">
        {post.title}
      </h1>

      {/* Local-only hearts/saves/report apply to seeded samples only. */}
      {showMetrics && (
      <div data-testid="community-detail-metrics" className="mt-3 flex items-center gap-4 border-t border-eve-sand pt-3 text-[13px] text-eve-teal-dark/75 rtl:flex-row-reverse">
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
          <Heart className={cn("h-4 w-4", hearted && "fill-current")} aria-hidden="true" />
          {post.hearts + (hearted ? 1 : 0)}
        </button>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
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
          <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onReport}
          aria-label={t("community.report")}
          className="inline-flex min-h-11 items-center gap-1 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[13px]">{t("community.report")}</span>
        </button>
      </div>
      )}
    </header>
  );
}
