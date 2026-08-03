import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lock, MapPin, Languages, Sparkles, Tag } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import {
  getCircleBySlug,
  getMyCircleMemberships,
  joinPublicCircle,
  leaveCircle,
  type PublicCircle,
} from "@/features/community/services/circlesService";

export const Route = createFileRoute("/eve/community/circle/$slug")({
  head: () => ({
    meta: [
      { title: "Circle — Eve & Eden Health" },
      {
        name: "description",
        content:
          "A curated Eve & Eden circle: what it is for, who it is organised around, and what is open during the pilot.",
      },
      { property: "og:title", content: "Circle — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "A curated Eve & Eden circle: what it is for, who it is organised around, and what is open during the pilot.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CircleDetailPage,
});

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-eve-sand bg-eve-cream/60 px-2 py-0.5 text-[12px] text-eve-teal-dark/75">
      {icon}
      {label}
    </span>
  );
}

function CircleDetailPage() {
  const { slug } = useParams({ from: "/eve/community/circle/$slug" });
  const { t } = useTranslation();
  const [circle, setCircle] = useState<PublicCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [membershipAvailable, setMembershipAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [result, mine] = await Promise.all([
        getCircleBySlug(slug),
        getMyCircleMemberships(),
      ]);
      if (cancelled) return;
      if (result.ok) {
        setCircle(result.data);
        track(ANALYTICS_EVENTS.circleOpened, {
          circle_id: result.data.id,
          circle_type: result.data.circle_type,
        });
        if (mine.ok) {
          setMembershipAvailable(true);
          setJoined(mine.data.some((m) => m.circle_id === result.data.id));
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggle() {
    if (!circle) return;
    setBusy(true);
    track(joined ? ANALYTICS_EVENTS.circleLeaveSelected : ANALYTICS_EVENTS.circleJoinSelected, {
      circle_id: circle.id,
    });
    const result = joined ? await leaveCircle(circle.id) : await joinPublicCircle(circle.id);
    if (result.ok) setJoined(!joined);
    else setMembershipAvailable(false);
    setBusy(false);
  }

  const place = circle ? [circle.city, circle.country_code].filter(Boolean).join(", ") : "";

  return (
    <EveShell>
      <Link
        to="/eve/community/circles"
        className="mb-2 mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] text-eve-teal-dark/70 rtl:flex-row-reverse"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        {t("community.circles.backToDirectory")}
      </Link>

      {loading ? (
        <div role="status" aria-live="polite" data-testid="circle-detail-loading">
          <span className="sr-only">{t("community.circles.loading")}</span>
          <div aria-hidden="true" className="h-36 animate-pulse rounded-2xl bg-eve-cream/70" />
        </div>
      ) : !circle ? (
        <div className="rounded-2xl border border-dashed border-eve-muted/30 bg-eve-cream/40 px-6 py-10 text-center">
          <p className="text-[14px] text-eve-teal-dark/75">
            {t("community.circles.notFound")}
          </p>
        </div>
      ) : (
        <>
          <header className="rtl:text-right">
            <h1 className="font-serif text-2xl text-eve-teal-dark">{circle.name}</h1>
            <p className="mt-1 text-[14px] leading-relaxed text-eve-teal-dark/75">
              {circle.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {place && <Row icon={<MapPin className="h-3 w-3" />} label={place} />}
              {circle.language_code && (
                <Row icon={<Languages className="h-3 w-3" />} label={circle.language_code} />
              )}
              {circle.life_stage && (
                <Row icon={<Sparkles className="h-3 w-3" />} label={circle.life_stage} />
              )}
              {circle.topic_category && (
                <Row icon={<Tag className="h-3 w-3" />} label={circle.topic_category} />
              )}
            </div>
          </header>

          <section className="mt-4 rounded-2xl border border-eve-sand bg-white p-4 rtl:text-right">
            <p className="text-[13px] font-semibold text-eve-teal-dark">
              {t("community.circles.membershipLabel")}
            </p>
            {membershipAvailable ? (
              <>
                <p className="mt-1 text-[13px] text-eve-teal-dark/75">
                  {joined
                    ? t("community.circles.stateJoined")
                    : t("community.circles.stateNotJoined")}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={toggle}
                  className="mt-3 min-h-11 rounded-full border border-eve-teal px-4 text-[13px] text-eve-teal disabled:opacity-50"
                >
                  {joined ? t("community.circles.leave") : t("community.circles.join")}
                </button>
              </>
            ) : (
              <p className="mt-1 text-[13px] text-eve-teal-dark/75">
                {t("community.circles.membershipUnavailable")}
              </p>
            )}
          </section>

          <p
            role="note"
            data-testid="circle-conversations-notice"
            className="mt-3 inline-flex items-start gap-2 rounded-2xl border border-eve-sand bg-eve-cream/60 px-4 py-3 text-[13px] leading-relaxed text-eve-teal-dark/75 rtl:text-right"
          >
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("community.circles.conversationsClosed")}
          </p>
        </>
      )}
    </EveShell>
  );
}
