import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MapPin, Languages, Sparkles, Tag } from "lucide-react";
import type { PublicCircle } from "@/features/community/services/circlesService";

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-eve-sand bg-eve-cream/60 px-2 py-0.5 text-[12px] text-eve-teal-dark/75">
      {icon}
      {label}
    </span>
  );
}

/** Renders only real metadata — no member counts, activity, or "popular" labels. */
export function CircleCard({
  circle,
  joined,
  membershipAvailable,
  busy,
  onToggleMembership,
}: {
  circle: PublicCircle;
  joined: boolean;
  membershipAvailable: boolean;
  busy?: boolean;
  onToggleMembership: () => void;
}) {
  const { t } = useTranslation();
  const place = [circle.city, circle.country_code].filter(Boolean).join(", ");

  return (
    <article className="rounded-2xl border border-eve-sand bg-white p-4 rtl:text-right">
      <Link
        to="/eve/community/circle/$slug"
        params={{ slug: circle.slug }}
        className="block"
      >
        <h3 className="font-sans text-[15px] font-semibold text-eve-teal-dark">
          {circle.name}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-eve-teal-dark/75">
          {circle.description}
        </p>
      </Link>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {place && <Chip icon={<MapPin className="h-3 w-3" />} label={place} />}
        {circle.language_code && (
          <Chip icon={<Languages className="h-3 w-3" />} label={circle.language_code} />
        )}
        {circle.life_stage && (
          <Chip icon={<Sparkles className="h-3 w-3" />} label={circle.life_stage} />
        )}
        {circle.topic_category && (
          <Chip icon={<Tag className="h-3 w-3" />} label={circle.topic_category} />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          to="/eve/community/circle/$slug"
          params={{ slug: circle.slug }}
          className="inline-flex min-h-11 items-center text-[13px] font-medium text-eve-teal"
        >
          {t("community.circles.view")}
        </Link>
        {membershipAvailable && (
          <button
            type="button"
            disabled={busy}
            onClick={onToggleMembership}
            className="min-h-9 rounded-full border border-eve-teal px-3 text-[13px] text-eve-teal disabled:opacity-50"
          >
            {joined ? t("community.circles.leave") : t("community.circles.join")}
          </button>
        )}
      </div>
    </article>
  );
}
