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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { EveShell } from "@/components/shells/EveShell";
import { StageRing } from "@/components/ui/StageRing";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AICard } from "@/components/ui/AICard";
import { GuidanceCard } from "@/components/ui/GuidanceCard";
import { supabase } from "@/integrations/supabase/client";
import { babySizeFor, trimesterFor } from "@/lib/babySize";
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
      const { data: g } = await supabase
        .from("guidance_content")
        .select("id, title, body, reviewed_by")
        .eq("is_published", true)
        .eq("language", language)
        .lte("week_min", week)
        .gte("week_max", week)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setGuidance(g as Guidance | null);

      if (g?.reviewed_by) {
        const { data: p } = await supabase
          .from("providers")
          .select("full_name")
          .eq("user_id", g.reviewed_by)
          .maybeSingle();
        if (!cancelled) setReviewerName(p?.full_name ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = (mother?.full_name ?? "").split(" ")[0] || "there";
  const week = mother?.pregnancy_week ?? 1;
  const greeting = greetingFor(mother?.language);
  const progressPct = Math.min(100, Math.round((week / 40) * 100));
  const dueDate = mother?.due_date
    ? new Date(mother.due_date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <EveShell>
      {/* Greeting */}
      <div className="px-3">
        <SectionLabel>
          {greeting}, {firstName} —
        </SectionLabel>
        <h1
          className="mt-1 font-serif text-eve-forest"
          style={{ fontSize: "22px" }}
        >
          {loading ? "Loading your week…" : `Week ${week} of your pregnancy`}
        </h1>
      </div>

      {/* Stage card */}
      <div className="mx-3 mt-4">
        {loading ? (
          <SkeletonBlock className="h-32" />
        ) : (
          <div className="rounded-2xl border border-eve-teal/20 bg-white p-4">
            <div className="flex items-center gap-4">
              <StageRing week={week} size={58} />
              <div className="min-w-0 flex-1">
                <SectionLabel>{trimesterFor(week)}</SectionLabel>
                <p
                  className="mt-1 font-sans text-eve-teal-dark"
                  style={{ fontSize: "12px" }}
                >
                  Baby is about the size of {babySizeFor(week)}.
                </p>
                {dueDate && (
                  <p
                    className="mt-1 font-sans text-eve-muted"
                    style={{ fontSize: "10px" }}
                  >
                    Due {dueDate}
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
        <AICard className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="font-sans uppercase tracking-widest text-white/70"
              style={{ fontSize: "10px" }}
            >
              Ask Eve anything
            </p>
            <p className="mt-0.5 truncate font-sans italic text-white text-sm">
              "{askSuggestionFor(week)}"
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-white" />
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
              className="block w-full text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <SectionLabel className="!text-eve-terra">
                  Today's guidance
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
                  Reviewed by Dr. {reviewerName}
                </span>
              )}
            </button>
          </GuidanceCard>
        ) : (
          <GuidanceCard>
            <SectionLabel className="!text-eve-terra">
              Today's guidance
            </SectionLabel>
            <p
              className="mt-1 font-sans text-eve-muted"
              style={{ fontSize: "12px" }}
            >
              New guidance for week {week} is on the way.
            </p>
          </GuidanceCard>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-5 px-3">
        <SectionLabel>Quick actions</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <QuickAction
            to="/eve/providers"
            icon={<Stethoscope className="h-[18px] w-[18px] text-eve-teal" />}
            label="Find a doctor"
            sub="Verified providers"
          />
          <QuickAction
            to="/eve/vendors"
            icon={<ShoppingBag className="h-[18px] w-[18px] text-eve-terra" />}
            label="Shop vendors"
            sub="Mama essentials"
          />
          <QuickAction
            to="/eve/appointments"
            icon={<Calendar className="h-[18px] w-[18px] text-eve-forest" />}
            label="My bookings"
            sub="Upcoming visits"
          />
          <QuickAction
            to="/eve/community"
            icon={<Users className="h-[18px] w-[18px] text-eve-rose" />}
            label="Community"
            sub="Mothers near you"
          />
        </div>
      </div>
    </EveShell>
  );
}

function QuickAction({
  to,
  icon,
  label,
  sub,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate({ to })}
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
