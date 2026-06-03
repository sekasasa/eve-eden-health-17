import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  MessageCircle,
  ArrowRight,
  Check,
  Stethoscope,
  ShoppingBag,
  Calendar,
  Users,
  ChevronDown,
  Sparkles,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { EveShell } from "@/components/shells/EveShell";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { StageRing } from "@/components/ui/StageRing";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AICard } from "@/components/ui/AICard";
import { GuidanceCard } from "@/components/ui/GuidanceCard";
import { supabase } from "@/integrations/supabase/client";
import { babySizeFor } from "@/lib/babySize";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/home")({
  component: EveHome,
});

type Mother = {
  id: string;
  full_name: string | null;
  pregnancy_week: number | null;
  due_date: string | null;
  language: string | null;
};

type Guidance = {
  id: string;
  title: string;
  body: string | null;
  reviewed_by: string | null;
};

function EveHome() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [mother, setMother] = useState<Mother | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data: m } = await supabase
        .from("mothers")
        .select("id, full_name, pregnancy_week, due_date, language")
        .eq("user_id", uid)
        .maybeSingle();
      if (cancelled) return;
      setMother(m as Mother | null);

      const week = m?.pregnancy_week ?? 1;
      const language = m?.language ?? "fr";

      async function fetchGuidance(lang: string) {
        return supabase
          .from("guidance_content")
          .select("id, title, body, reviewed_by")
          .eq("is_published", true)
          .eq("language", lang)
          .lte("week_min", week)
          .gte("week_max", week)
          .limit(1)
          .maybeSingle();
      }

      let { data: g } = await fetchGuidance(language);
      if (!g && language !== "fr") {
        ({ data: g } = await fetchGuidance("fr"));
      }
      if (cancelled) return;
      setGuidance(g as Guidance | null);

      if (g?.reviewed_by) {
        const { data: p } = await supabase
          .from("providers")
          .select("full_name")
          .eq("id", g.reviewed_by)
          .maybeSingle();
        if (!cancelled) setReviewerName(p?.full_name ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = (mother?.full_name ?? "").split(" ")[0] || "";
  const week = mother?.pregnancy_week ?? 1;
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("home.greeting_morning")
      : hour < 18
        ? t("home.greeting_afternoon")
        : t("home.greeting_evening");
  const progressPct = Math.min(100, Math.round((week / 40) * 100));
  const dueDate = mother?.due_date
    ? new Date(mother.due_date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const trimesterKey =
    week <= 13 ? "first" : week <= 27 ? "second" : "third";

  return (
    <EveShell>
      <PullToRefresh>
      {/* Greeting */}
      <div className="px-3 rtl:text-right">
        <SectionLabel>
          {greeting}
          {firstName ? `, ${firstName}` : ""} —
        </SectionLabel>
        <h1
          className="mt-1 font-serif text-eve-forest"
          style={{ fontSize: "22px" }}
        >
          {loading ? t("home.loadingWeek") : t("home.weekOf", { week })}
        </h1>
      </div>

      {/* Stage card */}
      <div className="mx-3 mt-4">
        {loading ? (
          <SkeletonBlock className="h-32" />
        ) : (
          <div className="rounded-2xl border border-eve-teal/20 bg-white p-4">
            <div className="flex items-center gap-4 rtl:flex-row-reverse">
              <StageRing week={week} size={58} />
              <div className="min-w-0 flex-1 rtl:text-right">
                <SectionLabel>{t(`trimester.${trimesterKey}`)}</SectionLabel>
                <p
                  className="mt-1 font-sans text-eve-teal-dark"
                  style={{ fontSize: "12px" }}
                >
                  {t("home.babySize", { size: babySizeFor(week) })}
                </p>
                {dueDate && (
                  <p
                    className="mt-1 font-sans text-eve-muted"
                    style={{ fontSize: "10px" }}
                  >
                    {t("home.due", { date: dueDate })}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-eve-teal-light">
              <div
                className="h-full rounded-full bg-eve-teal transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ask Eve */}
      <Link to="/eve/ask" className="mx-3 mt-3 block">
        <AICard className="flex items-center gap-3 p-4 rtl:flex-row-reverse">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1 rtl:text-right">
            <p
              className="font-sans uppercase tracking-widest text-white/70"
              style={{ fontSize: "10px" }}
            >
              {t("ask.title")}
            </p>
            <p className="mt-0.5 truncate font-sans italic text-white text-sm">
              "{t("ask.placeholder")}"
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-white rtl:rotate-180" />
        </AICard>
      </Link>


      {/* Today's guidance */}
      <div className="mx-3 mt-3">
        {loading ? (
          <SkeletonBlock className="h-24" />
        ) : guidance ? (
          <GuidanceCard>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="block w-full text-left rtl:text-right"
            >
              <div className="flex items-start justify-between gap-2 rtl:flex-row-reverse">
                <SectionLabel className="!text-eve-terra">
                  {t("home.todaysGuidance")}
                </SectionLabel>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-eve-muted transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </div>
              <p
                className="mt-1 font-sans text-eve-teal-dark"
                style={{ fontSize: "13px" }}
              >
                {guidance.title}
              </p>
              {guidance.body && (
                <p
                  className={cn(
                    "mt-1 font-sans text-eve-muted",
                    !expanded && "line-clamp-2",
                  )}
                  style={{ fontSize: "12px" }}
                >
                  {guidance.body}
                </p>
              )}
              {reviewerName && (
                <span
                  className="mt-2 inline-flex items-center gap-1 font-sans text-eve-teal"
                  style={{ fontSize: "11px" }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                  {t("home.reviewedBy", { name: reviewerName })}
                </span>
              )}
            </button>
          </GuidanceCard>
        ) : (
          <GuidanceCard>
            <SectionLabel className="!text-eve-terra">
              {t("home.todaysGuidance")}
            </SectionLabel>
            <p
              className="mt-1 font-sans text-eve-muted rtl:text-right"
              style={{ fontSize: "12px" }}
            >
              {t("home.guidanceComing", { week })}
            </p>
          </GuidanceCard>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-5 px-3 rtl:text-right">
        <SectionLabel>{t("home.quickActions")}</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <QuickAction
            to="/eve/providers"
            icon={<Stethoscope className="h-[18px] w-[18px] text-eve-teal" />}
            label={t("home.findDoctor")}
            sub={t("home.verifiedProviders")}
          />
          <QuickAction
            to="/eve/match/results"
            icon={<Sparkles className="h-[18px] w-[18px] text-eve-terra" />}
            label={t("home.fertility")}
            sub={t("home.fertilitySub")}
            onClick={() => {
              try {
                sessionStorage.setItem(
                  "eve_match_intake_v1",
                  JSON.stringify({ stage: "ivf" }),
                );
              } catch {
                /* ignore */
              }
            }}
          />

          <QuickAction
            to="/eve/match/labs"
            icon={<FlaskConical className="h-[18px] w-[18px] text-eve-teal" />}
            label={t("home.labsRx")}
            sub={t("home.labsRxSub")}
          />
          <QuickAction
            to="/eve/match/insurance"
            icon={<ShieldCheck className="h-[18px] w-[18px] text-eve-forest" />}
            label={t("home.insurance")}
            sub={t("home.insuranceSub")}
          />
          <QuickAction
            to="/eve/appointments"
            icon={<Calendar className="h-[18px] w-[18px] text-eve-forest" />}
            label={t("home.myBookings")}
            sub={t("home.upcomingVisits")}
          />
          <QuickAction
            to="/eve/vendors"
            icon={<ShoppingBag className="h-[18px] w-[18px] text-eve-terra" />}
            label={t("home.shopVendors")}
            sub={t("home.mamaEssentials")}
          />
          <QuickAction
            to="/eve/community"
            icon={<Users className="h-[18px] w-[18px] text-eve-rose" />}
            label={t("home.community")}
            sub={t("home.mothersNearYou")}
          />
          <QuickAction
            to="/eve/match"
            icon={<Sparkles className="h-[18px] w-[18px] text-eve-terra" />}
            label={t("home.findSupport")}
            sub={t("home.findSupportSub")}
          />
        </div>
      </div>
      </PullToRefresh>
    </EveShell>
  );
}

function QuickAction({
  to,
  icon,
  label,
  sub,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        navigate({ to });
      }}
      className="flex flex-col items-start gap-2 rounded-xl border border-eve-muted/20 bg-white p-3 text-left transition-transform active:scale-[0.98]"
    >

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-eve-cream">
        {icon}
      </div>
      <div>
        <p
          className="font-sans font-medium text-eve-teal-dark"
          style={{ fontSize: "11px" }}
        >
          {label}
        </p>
        <p
          className="font-sans text-eve-muted"
          style={{ fontSize: "10px" }}
        >
          {sub}
        </p>
      </div>
    </button>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full animate-pulse rounded-2xl bg-eve-muted/20",
        className,
      )}
    />
  );
}
