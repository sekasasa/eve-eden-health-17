import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { CircleCard } from "@/components/community/CircleCard";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  filterCircles,
  getMyCircleMemberships,
  getPublicCircles,
  joinPublicCircle,
  leaveCircle,
  type CircleFilterKey,
  type PublicCircle,
} from "@/features/community/services/circlesService";

export const Route = createFileRoute("/eve/community/circles")({
  head: () => ({
    meta: [
      { title: "Circles — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Browse curated circles organised around life stage, place, experience, and culture.",
      },
      { property: "og:title", content: "Circles — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Browse curated circles organised around life stage, place, experience, and culture.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CirclesDirectoryPage,
});

const FILTERS: { key: CircleFilterKey; labelKey: string }[] = [
  { key: "all", labelKey: "community.circles.filters.all" },
  { key: "near_you", labelKey: "community.circles.filters.nearYou" },
  { key: "journey", labelKey: "community.circles.filters.journey" },
  { key: "experience", labelKey: "community.circles.filters.experience" },
  { key: "culture", labelKey: "community.circles.filters.culture" },
];

function CirclesDirectoryPage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [circles, setCircles] = useState<PublicCircle[]>([]);
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});
  const [membershipAvailable, setMembershipAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<CircleFilterKey>("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    track(ANALYTICS_EVENTS.circlesDirectoryOpened);
    let cancelled = false;
    (async () => {
      const [list, mine] = await Promise.all([
        getPublicCircles({ limit: 50 }),
        getMyCircleMemberships(),
      ]);
      if (cancelled) return;
      if (!list.ok) {
        setError(true);
      } else {
        setCircles(list.data);
      }
      if (mine.ok) {
        setMembershipAvailable(true);
        const map: Record<string, boolean> = {};
        mine.data.forEach((m) => {
          map[m.circle_id] = true;
        });
        setMemberships(map);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => filterCircles(circles, filter), [circles, filter]);

  async function onToggleMembership(circle: PublicCircle) {
    setBusy(circle.id);
    const joined = Boolean(memberships[circle.id]);
    track(
      joined ? ANALYTICS_EVENTS.circleLeaveSelected : ANALYTICS_EVENTS.circleJoinSelected,
      { circle_id: circle.id },
    );
    const result = joined ? await leaveCircle(circle.id) : await joinPublicCircle(circle.id);
    if (result.ok) {
      setMemberships((m) => ({ ...m, [circle.id]: !joined }));
    } else {
      setMembershipAvailable(false);
    }
    setBusy(null);
  }

  return (
    <EveShell>
      <button
        onClick={() => nav({ to: "/eve/community" })}
        className="mb-2 mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] text-eve-teal-dark/70 rtl:flex-row-reverse"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {t("common.back")}
      </button>

      <header className="rtl:text-right">
        <h1 className="font-serif text-2xl text-eve-teal-dark">
          {t("community.circles.title")}
        </h1>
        <p className="mt-1 text-[14px] leading-relaxed text-eve-teal-dark/75">
          {t("community.circles.intro")}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={t("community.circles.filtersLabel")}
        className="mt-4 flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "min-h-9 rounded-full border px-3 text-[13px]",
              filter === f.key
                ? "border-eve-teal bg-eve-teal text-white"
                : "border-eve-sand bg-white text-eve-teal-dark/75",
            )}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {!loading && !membershipAvailable && (
        <p
          role="note"
          data-testid="circles-membership-notice"
          className="mt-4 rounded-2xl border border-eve-sand bg-eve-cream/60 px-4 py-3 text-[13px] leading-relaxed text-eve-teal-dark/75 rtl:text-right"
        >
          {t("community.circles.membershipUnavailable")}
        </p>
      )}

      {error && (
        <p
          role="status"
          data-testid="circles-error"
          className="mt-4 rounded-2xl border border-eve-sand bg-white px-4 py-3 text-[13px] text-eve-teal-dark/75 rtl:text-right"
        >
          {t("community.circles.loadError")}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <div role="status" aria-live="polite" data-testid="circles-loading">
            <span className="sr-only">{t("community.circles.loading")}</span>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                aria-hidden="true"
                className="mb-3 h-28 animate-pulse rounded-2xl bg-eve-cream/70"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-eve-muted/30 bg-eve-cream/40 px-6 py-10 text-center">
            <Users className="mx-auto h-5 w-5 text-eve-muted" aria-hidden="true" />
            <p className="mt-2 text-[14px] text-eve-teal-dark/75">
              {t("community.circles.empty")}
            </p>
          </div>
        ) : (
          visible.map((c) => (
            <CircleCard
              key={c.id}
              circle={c}
              joined={Boolean(memberships[c.id])}
              membershipAvailable={membershipAvailable}
              busy={busy === c.id}
              onToggleMembership={() => onToggleMembership(c)}
            />
          ))
        )}
      </div>

      <p className="mt-6 text-[12px] text-eve-muted rtl:text-right">
        {t("community.circles.browseOnlyNotice")}
      </p>

      <Link
        to="/eve/community"
        className="mt-4 inline-flex min-h-11 items-center text-[13px] text-eve-teal"
      >
        {t("community.circles.backToCommunity")}
      </Link>
    </EveShell>
  );
}
