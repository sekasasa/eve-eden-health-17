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
  
  ClipboardList,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { EveShell } from "@/components/shells/EveShell";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { StageRing } from "@/components/ui/StageRing";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AICard } from "@/components/ui/AICard";
import { GuidanceCard } from "@/components/ui/GuidanceCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { supabase } from "@/integrations/supabase/client";
import { babySizeFor } from "@/lib/babySize";
import { cn } from "@/lib/utils";
import { hydrateIntakeFromCloud, type MatchIntake } from "@/lib/match-store";
import type { LifeStage } from "@/lib/match-data";
import { useCarePreferences } from "@/hooks/useCarePreferences";
import { homeCalloutsFromPrefs, prefHelpers } from "@/lib/personalization";

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

const SKIP_KEY = "eve_personalize_skipped_v1";

// Personalized dashboard titles by life stage
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


// 5 consolidated Quick Action keys
type QAKey = "find_care" | "care_support" | "care_plan" | "shops" | "community";

const QA_DEFS: Record<QAKey, {
  to: string;
  icon: React.ReactNode;
  en: { label: string; sub: string };
  fr: { label: string; sub: string };
  ar: { label: string; sub: string };
  onClick?: () => void;
}> = {
  find_care: {
    to: "/eve/providers",
    icon: <Stethoscope className="h-[18px] w-[18px] text-eve-teal" />,
    en: { label: "Find the right provider", sub: "Doctors, midwives, IVF, pediatrics" },
    fr: { label: "Trouver le bon soignant", sub: "Médecins, sages-femmes, FIV, pédiatrie" },
    ar: { label: "ابحث عن الرعاية المناسبة", sub: "أطباء، قابلات، تلقيح صناعي، أطفال" },
  },
  care_support: {
    to: "/eve/care-support",
    icon: <FlaskConical className="h-[18px] w-[18px] text-eve-teal" />,
    en: { label: "Understand labs, prescriptions & payment", sub: "Get help with results, meds, and how to pay" },
    fr: { label: "Comprendre analyses, ordonnances & paiement", sub: "Résultats, médicaments et options de paiement" },
    ar: { label: "افهم التحاليل والأدوية والدفع", sub: "مساعدة في النتائج والأدوية وكيفية الدفع" },
  },
  care_plan: {
    to: "/eve/match/results",
    icon: <ClipboardList className="h-[18px] w-[18px] text-eve-forest" />,
    en: { label: "My Care Plan", sub: "Next steps and appointments" },
    fr: { label: "Mon plan de soins", sub: "Prochaines étapes et rendez-vous" },
    ar: { label: "خطة رعايتي", sub: "الخطوات التالية والمواعيد" },
  },
  shops: {
    to: "/eve/vendors",
    icon: <ShoppingBag className="h-[18px] w-[18px] text-eve-terra" />,
    en: { label: "Shops & Services", sub: "Essentials, wellness, partners" },
    fr: { label: "Boutiques & services", sub: "Essentiels, bien-être, partenaires" },
    ar: { label: "المتاجر والخدمات", sub: "أساسيات، عافية، شركاء" },
  },
  community: {
    to: "/eve/community",
    icon: <Users className="h-[18px] w-[18px] text-eve-rose" />,
    en: { label: "Community & Support", sub: "Navigator, family, women near you" },
    fr: { label: "Communauté & soutien", sub: "Navigatrice, famille, femmes près de vous" },
    ar: { label: "المجتمع والدعم", sub: "المرشدة، العائلة، نساء قربك" },
  },
};


const DEFAULT_ORDER: QAKey[] = ["find_care", "care_support", "care_plan", "shops", "community"];

function orderForStage(stage?: LifeStage): QAKey[] {
  const rest = (head: QAKey[]) =>
    [...head, ...DEFAULT_ORDER.filter((k) => !head.includes(k))] as QAKey[];
  switch (stage) {
    case "ivf":
    case "ttc":
      return rest(["find_care", "care_support", "care_plan"]);
    case "pregnant":
      return rest(["find_care", "care_plan", "care_support"]);
    case "postpartum":
      return rest(["care_plan", "community", "shops"]);
    case "labs":
    case "rx":
    case "insurance":
      return rest(["care_support", "find_care", "care_plan"]);
    case "family":
      return rest(["community", "care_support", "care_plan"]);
    case "pcos":
      return rest(["find_care", "care_support", "care_plan"]);
    case "mood":
      return rest(["find_care", "community", "care_plan"]);
    case "wellness":
      return rest(["find_care", "care_support", "shops"]);
    case "newborn":
      return rest(["find_care", "shops", "care_plan"]);
    default:
      return DEFAULT_ORDER;
  }
}


function EveHome() {
  const { t, i18n } = useTranslation();
  const lang: "en" | "fr" | "ar" = i18n.language?.startsWith("fr")
    ? "fr"
    : i18n.language?.startsWith("ar")
      ? "ar"
      : "en";
  const { prefs } = useCarePreferences();
  const callouts = homeCalloutsFromPrefs(prefs);
  // Reserved: gate family supporter widgets when family is preferred and not private.
  void prefHelpers; // tree-shake guard

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

      // Hydrate latest match intake
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

  // First-time personalization gate
  const needsPersonalization = intakeChecked && !intake && !skipped;
  if (needsPersonalization) {
    return (
      <EveShell>
        <div className="mt-6 rounded-2xl border border-eve-teal/20 bg-white p-6">
          <SectionLabel>
            {lang === "fr" ? "Bienvenue" : "Welcome"}
          </SectionLabel>
          <h1
            className="mt-2 font-serif text-eve-forest"
            style={{ fontSize: "22px" }}
          >
            {lang === "fr"
              ? "Personnalisons votre parcours de soins"
              : "Let's personalize your care"}
          </h1>
          <p
            className="mt-3 font-sans text-eve-muted"
            style={{ fontSize: "13px" }}
          >
            {lang === "fr"
              ? "Répondez à quelques questions pour qu'Eve & Eden vous propose la langue, les praticiens, le soutien, les options d'assurance et les prochaines étapes qui vous correspondent."
              : "Answer a few questions so Eve & Eden can show the right language, providers, support, insurance options, and next steps for you."}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <PrimaryButton
              onClick={() => navigate({ to: "/eve/match" })}
              className="w-full"
            >
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
  const personalizedTitle =
    stage && STAGE_TITLES[stage] ? STAGE_TITLES[stage][lang] : null;
  const qaOrder = orderForStage(stage);
  const isPregnancyStage = stage === "pregnant" || (!stage && (mother?.pregnancy_week ?? 0) > 0);

  // Stage-specific "where you are" subtitle for non-pregnant users
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


  return (
    <EveShell>
      <PullToRefresh>
        {/* Skip banner */}
        {skipped && !intake && (
          <div className="mx-3 mt-2 flex items-center justify-between gap-3 rounded-xl border border-eve-terra/30 bg-eve-cream px-3 py-2">
            <p
              className="font-sans text-eve-teal-dark"
              style={{ fontSize: "11px" }}
            >
              {lang === "fr"
                ? "Personnalisez vos soins pour de meilleures recommandations."
                : "Personalize your care to get better matches."}
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/eve/match" })}
              className="shrink-0 rounded-full bg-eve-teal px-3 py-1 font-sans text-white"
              style={{ fontSize: "11px" }}
            >
              {lang === "fr" ? "Compléter" : "Complete profile"}
            </button>
          </div>
        )}

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
            {personalizedTitle ??
              (loading ? t("home.loadingWeek") : t("home.weekOf", { week }))}
          </h1>
          <p
            className="mt-1 font-sans text-eve-muted"
            style={{ fontSize: "12px" }}
          >
            {lang === "fr"
              ? "Dites-nous ce qu'il vous faut — nous trouvons vos prochaines étapes."
              : "Tell us what you need — we'll find your next steps."}
          </p>
        </div>

        {/* HERO: Care plan if intake exists, else pregnancy stage if pregnant, else generic stage card */}
        {intake?.stage ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/eve/match/results" })}
            className="mx-3 mt-4 block w-full rounded-2xl border border-eve-teal/30 bg-gradient-to-br from-white to-eve-teal-light/40 p-4 text-left transition-transform active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SectionLabel>
                  {lang === "fr" ? "Votre plan de soins" : "Your care plan"}
                </SectionLabel>
                <p className="mt-1 font-serif text-eve-forest" style={{ fontSize: "16px" }}>
                  {personalizedTitle}
                </p>
                <p className="mt-1 font-sans text-eve-muted" style={{ fontSize: "12px" }}>
                  {lang === "fr"
                    ? "Voir vos prochaines étapes et soins recommandés."
                    : "See your next steps and recommended care."}
                </p>
              </div>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eve-teal text-white">
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </span>
            </div>
          </button>
        ) : isPregnancyStage ? (
          <div className="mx-3 mt-4">
            {loading ? (
              <SkeletonBlock className="h-32" />
            ) : (
              <div className="rounded-2xl border border-eve-teal/20 bg-white p-4">
                <div className="flex items-center gap-4 rtl:flex-row-reverse">
                  <StageRing week={week} size={58} />
                  <div className="min-w-0 flex-1 rtl:text-right">
                    <SectionLabel>{t(`trimester.${trimesterKey}`)}</SectionLabel>
                    <p className="mt-1 font-sans text-eve-teal-dark" style={{ fontSize: "12px" }}>
                      {t("home.babySize", { size: babySizeFor(week) })}
                    </p>
                    {dueDate && (
                      <p className="mt-1 font-sans text-eve-muted" style={{ fontSize: "10px" }}>
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
        ) : stage && STAGE_SUBTITLE[stage] ? (
          <div className="mx-3 mt-4 rounded-2xl border border-eve-teal/20 bg-white p-4">
            <SectionLabel>{lang === "fr" ? "Où vous en êtes" : "Where you are"}</SectionLabel>
            <p className="mt-1 font-sans text-eve-teal-dark" style={{ fontSize: "13px" }}>
              {STAGE_SUBTITLE[stage]![lang]}
            </p>
          </div>
        ) : null}

        {/* Ask Eve — what do you need today */}
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
                {lang === "fr" ? "Que cherchez-vous aujourd'hui ?" : "What do you need today?"}
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

        {/* Personalized callouts (only from explicit prefs) */}
        {callouts.length > 0 && (
          <div className="mt-4 px-3">
            <SectionLabel>
              {lang === "fr" ? "Pour vous" : lang === "ar" ? "لأجلك" : "For you"}
            </SectionLabel>
            <div className="mt-2 space-y-2">
              {callouts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => c.to && navigate({ to: c.to })}
                  className="block w-full rounded-2xl border border-eve-rose/20 bg-white p-3 text-left"
                >
                  <p className="font-sans text-sm font-medium text-eve-teal-dark">{c.title}</p>
                  <p className="mt-0.5 font-sans text-[11px] text-eve-muted">{c.body}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions — 6 consolidated cards, ordered by stage */}
        <div className="mt-5 px-3 rtl:text-right">
          <SectionLabel>{t("home.quickActions")}</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {qaOrder.map((k) => {
              const def = QA_DEFS[k];
              const copy = def[lang];
              return (
                <QuickAction
                  key={k}
                  to={def.to}
                  icon={def.icon}
                  label={copy.label}
                  sub={copy.sub}
                  onClick={def.onClick}
                />
              );
            })}
          </div>

          {/* Care passport + referrals quick links */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/eve/passport" })}
              className="rounded-2xl bg-white px-3 py-3 text-left"
            >
              <p className="font-sans text-sm font-semibold text-eve-teal-dark">
                {lang === "fr" ? "Mon carnet de soins" : "Care Passport"}
              </p>
              <p className="mt-0.5 font-sans text-[11px] text-eve-muted">
                {lang === "fr"
                  ? "Documents, partage, contrôle"
                  : "Documents, sharing, control"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/eve/referrals" })}
              className="rounded-2xl bg-white px-3 py-3 text-left"
            >
              <p className="font-sans text-sm font-semibold text-eve-teal-dark">
                {lang === "fr" ? "Recommandations" : "Referrals"}
              </p>
              <p className="mt-0.5 font-sans text-[11px] text-eve-muted">
                {lang === "fr"
                  ? "Prochaines étapes de mes prestataires"
                  : "Next steps from your providers"}
              </p>
            </button>
          </div>

          {/* Events entry */}
          <button
            type="button"
            onClick={() => navigate({ to: "/eve/events" })}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white px-3 py-3 text-left"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-eve-teal" />
              <span>
                <span className="block font-sans text-sm font-semibold text-eve-teal-dark">
                  {lang === "fr"
                    ? "Événements & ateliers"
                    : lang === "ar"
                      ? "الفعاليات وورش العمل"
                      : "Events & Workshops"}
                </span>
                <span className="mt-0.5 block font-sans text-[11px] text-eve-muted">
                  {lang === "fr"
                    ? "Cours, rencontres et bien-être pour mamans"
                    : lang === "ar"
                      ? "دروس ولقاءات وعافية للأمهات"
                      : "Classes, talks, and wellness for mothers"}
                </span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-eve-teal" />
          </button>


          {/* Update care profile entry */}
          <button
            type="button"
            onClick={() => navigate({ to: "/eve/match" })}
            className="mt-3 inline-flex items-center gap-1 font-sans text-eve-teal underline-offset-2 hover:underline"
            style={{ fontSize: "12px" }}
          >
            <Sparkles className="h-3 w-3" />
            {lang === "fr" ? "Mettre à jour mon profil de soins" : "Update my care profile"}
          </button>
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
