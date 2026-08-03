import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronDown, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EveShell } from "@/components/shells/EveShell";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { StageRing } from "@/components/ui/StageRing";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { GuidanceCard } from "@/components/ui/GuidanceCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { NeedPrompt } from "@/components/home/NeedPrompt";
import { ActivityCard } from "@/components/home/ActivityCard";
import { UpcomingSection } from "@/components/home/UpcomingSection";
import { CommunityPreview } from "@/components/home/CommunityPreview";
import { ProvidersPreview } from "@/components/home/ProvidersPreview";
import { supabase } from "@/integrations/supabase/client";
import { babySizeFor } from "@/lib/babySize";
import { cn } from "@/lib/utils";
import { hydrateIntakeFromCloud, type MatchIntake } from "@/lib/match-store";
import type { LifeStage } from "@/lib/match-data";
import { useCarePreferences } from "@/hooks/useCarePreferences";
import { homeCalloutsFromPrefs } from "@/lib/personalization";

export const Route = createFileRoute("/eve/home")({
  head: () => ({
    meta: [
      { title: "Your care home — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Ask a question, see what's next in your care, and connect with verified providers and other mothers.",
      },
      { property: "og:title", content: "Your care home — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Ask a question, see what's next in your care, and connect with verified providers and other mothers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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

const SKIP_KEY = "eve_personalize_skipped_v1";

const STAGE_TITLES: Record<string, { en: string; fr: string; ar: string }> = {
  ttc: { en: "Your fertility support plan", fr: "Votre plan de fertilité", ar: "خطة دعم الخصوبة الخاصة بك" },
  ivf: { en: "Your IVF & fertility care plan", fr: "Votre plan de soins FIV", ar: "خطة رعاية التلقيح الصناعي والخصوبة" },
  pregnant: { en: "Your pregnancy care plan", fr: "Votre plan de grossesse", ar: "خطة رعاية الحمل الخاصة بك" },
  postpartum: { en: "Your postpartum support plan", fr: "Votre plan post-partum", ar: "خطة دعم ما بعد الولادة" },
  newborn: { en: "Your child care support plan", fr: "Votre plan de garde d'enfant", ar: "خطة دعم رعاية الطفل" },
  pcos: { en: "Your hormonal health support plan", fr: "Votre plan de santé hormonale", ar: "خطة دعم الصحة الهرمونية" },
  mood: { en: "Your mood support plan", fr: "Votre plan de soutien émotionnel", ar: "خطة دعم الصحة النفسية" },
  labs: { en: "Your lab results support plan", fr: "Votre plan d'analyses", ar: "خطة دعم نتائج التحاليل" },
  rx: { en: "Your prescription support plan", fr: "Votre plan d'ordonnances", ar: "خطة دعم الأدوية" },
  insurance: { en: "Your insurance & payment options", fr: "Vos options d'assurance", ar: "خيارات التأمين والدفع" },
  wellness: { en: "Your wellness care plan", fr: "Votre plan de bien-être", ar: "خطة العافية الخاصة بك" },
  family: { en: "Your family care coordination plan", fr: "Votre plan de coordination familiale", ar: "خطة تنسيق رعاية العائلة" },
};

const STAGE_SUBTITLE: Partial<Record<LifeStage, { en: string; fr: string; ar: string }>> = {
  ttc: { en: "Trying to conceive", fr: "Essais de conception", ar: "محاولة الحمل" },
  ivf: { en: "Fertility treatment", fr: "Traitement de fertilité", ar: "علاج الخصوبة" },
  postpartum: { en: "Postpartum recovery", fr: "Récupération post-partum", ar: "تعافي ما بعد الولادة" },
  newborn: { en: "Caring for your child", fr: "Soin de votre enfant", ar: "العناية بطفلك" },
  pcos: { en: "Hormonal health", fr: "Santé hormonale", ar: "الصحة الهرمونية" },
  mood: { en: "Emotional wellbeing", fr: "Bien-être émotionnel", ar: "الصحة النفسية" },
  labs: { en: "Lab results support", fr: "Soutien analyses", ar: "دعم نتائج التحاليل" },
  rx: { en: "Prescription support", fr: "Soutien ordonnances", ar: "دعم الأدوية" },
  insurance: { en: "Coverage & payment", fr: "Couverture & paiement", ar: "التغطية والدفع" },
  wellness: { en: "Wellness journey", fr: "Bien-être", ar: "رحلة العافية" },
  family: { en: "Family coordination", fr: "Coordination familiale", ar: "تنسيق العائلة" },
};

function EveHome() {
  const { t, i18n } = useTranslation();
  const lang: "en" | "fr" | "ar" = i18n.language?.startsWith("fr")
    ? "fr"
    : i18n.language?.startsWith("ar")
      ? "ar"
      : "en";
  const { prefs } = useCarePreferences();
  const callouts = homeCalloutsFromPrefs(prefs);

  const [loading, setLoading] = useState(true);
  const [mother, setMother] = useState<Mother | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [intake, setIntake] = useState<MatchIntake | null>(null);
  const [intakeChecked, setIntakeChecked] = useState(false);
  const [skipped, setSkipped] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SKIP_KEY) === "1";
  });
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) {
        setLoading(false);
        setIntakeChecked(true);
        return;
      }
      const { data: m } = await supabase
        .from("mothers")
        .select("id, full_name, pregnancy_week, due_date, language")
        .eq("user_id", uid)
        .maybeSingle();
      if (cancelled) return;
      setMother(m as Mother | null);

      const i = await hydrateIntakeFromCloud();
      if (cancelled) return;
      setIntake(i && i.stage ? i : null);
      setIntakeChecked(true);

      const week = m?.pregnancy_week ?? 1;
      const language = m?.language ?? "fr";

      async function fetchGuidance(l: string) {
        return supabase
          .from("guidance_content")
          .select("id, title, body, reviewed_by")
          .eq("is_published", true)
          .eq("language", l)
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

  const trimesterKey = week <= 13 ? "first" : week <= 27 ? "second" : "third";

  const needsPersonalization = intakeChecked && !intake && !skipped;
  if (needsPersonalization) {
    return (
      <EveShell>
        <div className="mt-6 rounded-2xl border border-eve-teal/20 bg-white p-6">
          <SectionLabel>{lang === "fr" ? "Bienvenue" : "Welcome"}</SectionLabel>
          <h1 className="mt-2 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
            {lang === "fr"
              ? "Personnalisons votre parcours de soins"
              : "Let's personalize your care"}
          </h1>
          <p className="mt-3 font-sans text-eve-muted" style={{ fontSize: "13px" }}>
            {lang === "fr"
              ? "Répondez à quelques questions pour qu'Eve & Eden vous propose la langue, les praticiens, le soutien, les options d'assurance et les prochaines étapes qui vous correspondent."
              : "Answer a few questions so Eve & Eden can show the right language, providers, support, insurance options, and next steps for you."}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <PrimaryButton onClick={() => navigate({ to: "/eve/match" })} className="w-full">
              {lang === "fr" ? "Commencer" : "Start"}
            </PrimaryButton>
            <SecondaryButton
              onClick={() => {
                sessionStorage.setItem(SKIP_KEY, "1");
                setSkipped(true);
              }}
              className="w-full"
            >
              {lang === "fr" ? "Plus tard" : "Skip for now"}
            </SecondaryButton>
          </div>
        </div>
      </EveShell>
    );
  }

  const stage = intake?.stage as LifeStage | undefined;
  const personalizedTitle = stage && STAGE_TITLES[stage] ? STAGE_TITLES[stage][lang] : null;
  const isPregnancyStage =
    stage === "pregnant" || (!stage && (mother?.pregnancy_week ?? 0) > 0);

  return (
    <EveShell>
      <PullToRefresh>
        {skipped && !intake && (
          <div className="mx-3 mt-2 flex items-center justify-between gap-3 rounded-xl border border-eve-terra/30 bg-eve-cream px-3 py-2">
            <p className="font-sans text-[12px] text-eve-teal-dark">
              {t("homev2.personalizeBanner")}
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/eve/match" })}
              className="min-h-11 shrink-0 rounded-full bg-eve-teal px-3 font-sans text-[12px] text-white"
            >
              {t("homev2.personalizeCta")}
            </button>
          </div>
        )}

        {/* A. Greeting + universal need prompt */}
        <div className="px-3 rtl:text-right">
          <SectionLabel>
            {greeting}
            {firstName ? `, ${firstName}` : ""} —
          </SectionLabel>
          <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "24px" }}>
            {personalizedTitle ??
              (loading ? t("home.loadingWeek") : t("home.weekOf", { week }))}
          </h1>
        </div>

        <NeedPrompt />

        {/* B. Activity */}
        <ActivityCard lang={lang} />

        {/* C. One prioritized next step */}
        <NextStep hasIntake={Boolean(intake?.stage)} planTitle={personalizedTitle} />

        {/* D. Community preview */}
        <CommunityPreview stage={stage ?? null} lang={lang} />

        {/* E. Providers for you */}
        <ProvidersPreview prefs={prefs} lang={lang} />

        {/* F. Upcoming appointments & events */}
        <UpcomingSection lang={lang} />

        {/* G. Compact care-plan summary */}
        <CarePlanSummary
          loading={loading}
          isPregnancyStage={isPregnancyStage}
          week={week}
          dueDate={dueDate}
          trimesterKey={trimesterKey}
          stageSubtitle={stage && STAGE_SUBTITLE[stage] ? STAGE_SUBTITLE[stage]![lang] : null}
        />

        {/* Guidance */}
        <div className="mx-3 mt-5">
          {loading ? (
            <SkeletonBlock className="h-24" />
          ) : guidance ? (
            <GuidanceCard>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="block w-full text-left rtl:text-right"
              >
                <div className="flex items-start justify-between gap-2 rtl:flex-row-reverse">
                  <SectionLabel className="!text-eve-terra">
                    {t("home.todaysGuidance")}
                  </SectionLabel>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-eve-teal-dark/60 transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </div>
                <p className="mt-1 font-sans text-[14px] text-eve-teal-dark">{guidance.title}</p>
                {guidance.body && (
                  <p
                    className={cn(
                      "mt-1 font-sans text-[13px] text-eve-teal-dark/75",
                      !expanded && "line-clamp-2",
                    )}
                  >
                    {guidance.body}
                  </p>
                )}
                {reviewerName && (
                  <span className="mt-2 inline-flex items-center gap-1 font-sans text-[12px] text-eve-teal">
                    <Check className="h-3 w-3" strokeWidth={3} />
                    {t("home.reviewedBy", { name: reviewerName })}
                  </span>
                )}
              </button>
            </GuidanceCard>
          ) : (
            <GuidanceCard>
              <SectionLabel className="!text-eve-terra">{t("home.todaysGuidance")}</SectionLabel>
              <p className="mt-1 font-sans text-[13px] text-eve-teal-dark/75 rtl:text-right">
                {t("home.guidanceComing", { week })}
              </p>
            </GuidanceCard>
          )}
        </div>

        {/* Personalized callouts (only from explicit prefs) */}
        {callouts.length > 0 && (
          <div className="mt-5 px-3 rtl:text-right">
            <SectionLabel>
              {lang === "fr" ? "Pour vous" : lang === "ar" ? "لأجلك" : "For you"}
            </SectionLabel>
            <div className="mt-2 space-y-2">
              {callouts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => c.to && navigate({ to: c.to })}
                  className="block w-full rounded-2xl border border-eve-rose/20 bg-white p-3 text-left rtl:text-right"
                >
                  <p className="font-sans text-[14px] font-medium text-eve-teal-dark">{c.title}</p>
                  <p className="mt-0.5 font-sans text-[12px] text-eve-teal-dark/70">{c.body}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 px-3 rtl:text-right">
          <button
            type="button"
            onClick={() => navigate({ to: "/eve/match" })}
            className="inline-flex min-h-11 items-center gap-1 font-sans text-[13px] text-eve-teal underline-offset-2 hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {lang === "fr" ? "Mettre à jour mon profil de soins" : "Update my care profile"}
          </button>
        </div>
      </PullToRefresh>
    </EveShell>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("w-full animate-pulse rounded-2xl bg-eve-muted/20", className)} />
  );
}
