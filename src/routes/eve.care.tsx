import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Bookmark,
  CalendarDays,
  ClipboardList,
  FileHeart,
  HeartHandshake,
  Search,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Users,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useLanguage } from "@/hooks/useLanguage";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { isFeatureEnabled } from "@/lib/flags";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/care")({
  head: () => ({
    meta: [
      { title: "Care Hub — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Find verified maternal care, manage appointments and next steps, and reach labs, prescription and payment support in one place.",
      },
      { property: "og:title", content: "Care Hub — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Find verified maternal care, manage appointments and next steps, and reach labs, prescription and payment support in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareHub,
});

type Lang = "en" | "fr" | "ar";
type L10n = Record<Lang, string>;

const COPY = {
  title: { en: "Care", fr: "Soins", ar: "الرعاية" } as L10n,
  intro: {
    en: "Find providers, keep track of your next steps, and reach care support — all in one place.",
    fr: "Trouvez des praticiens, suivez vos prochaines étapes et accédez au soutien de soins — au même endroit.",
    ar: "ابحثي عن مقدمي الرعاية، وتابعي خطواتك التالية، واحصلي على دعم الرعاية — في مكان واحد.",
  } as L10n,
  findTitle: {
    en: "Find trusted care",
    fr: "Trouver des soins de confiance",
    ar: "ابحثي عن رعاية موثوقة",
  } as L10n,
  findBody: {
    en: "Browse providers we have verified. You can filter by city, language and care preferences.",
    fr: "Parcourez les praticiens que nous avons vérifiés. Filtrez par ville, langue et préférences de soins.",
    ar: "تصفحي مقدمي الرعاية الذين تحققنا منهم. يمكنك التصفية حسب المدينة واللغة وتفضيلات الرعاية.",
  } as L10n,
  findCta: {
    en: "Search providers",
    fr: "Rechercher des praticiens",
    ar: "ابحثي عن مقدمي الرعاية",
  } as L10n,
  matchCta: {
    en: "Not sure where to start? Answer a few questions",
    fr: "Vous ne savez pas par où commencer ? Répondez à quelques questions",
    ar: "لا تعرفين من أين تبدئين؟ أجيبي عن أسئلة قليلة",
  } as L10n,
  yourCare: { en: "Your care", fr: "Vos soins", ar: "رعايتك" } as L10n,
  events: { en: "Events & classes", fr: "Événements et ateliers", ar: "الفعاليات والدروس" } as L10n,
  eventsOff: {
    en: "Browsing is open. Registration is not live yet.",
    fr: "La consultation est ouverte. L'inscription n'est pas encore active.",
    ar: "التصفح متاح. التسجيل غير مفعّل بعد.",
  } as L10n,
  careSupport: { en: "Care support", fr: "Soutien aux soins", ar: "دعم الرعاية" } as L10n,
  more: { en: "More tools", fr: "Autres outils", ar: "أدوات إضافية" } as L10n,
  saved: { en: "Saved", fr: "Enregistré", ar: "المحفوظات" } as L10n,
  savedEmpty: {
    en: "Saved care will appear here.",
    fr: "Les soins enregistrés apparaîtront ici.",
    ar: "ستظهر هنا عناصر الرعاية المحفوظة.",
  } as L10n,
  trust: {
    en: "We only list providers we have verified.",
    fr: "Nous ne listons que des praticiens vérifiés.",
    ar: "نعرض فقط مقدمي الرعاية الذين تحققنا منهم.",
  } as L10n,
};

type Item = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: L10n;
  sub: L10n;
};

const YOUR_CARE: Item[] = [
  {
    to: "/eve/match/results",
    icon: FileHeart,
    label: { en: "My care plan", fr: "Mon plan de soins", ar: "خطة رعايتي" },
    sub: {
      en: "Your matched providers and suggested next steps",
      fr: "Vos praticiens correspondants et prochaines étapes suggérées",
      ar: "مقدمو الرعاية المطابقون والخطوات التالية المقترحة",
    },
  },
  {
    to: "/eve/appointments",
    icon: CalendarDays,
    label: { en: "Appointments", fr: "Rendez-vous", ar: "المواعيد" },
    sub: {
      en: "Requests and visits saved to your account",
      fr: "Demandes et visites enregistrées sur votre compte",
      ar: "الطلبات والزيارات المحفوظة في حسابك",
    },
  },
  {
    to: "/eve/referrals",
    icon: Users,
    label: { en: "Referrals", fr: "Orientations", ar: "الإحالات" },
    sub: {
      en: "Referrals shared with you by a provider",
      fr: "Orientations partagées par un praticien",
      ar: "إحالات شاركها معك مقدم رعاية",
    },
  },
];

const CARE_SUPPORT: Item[] = [
  {
    to: "/eve/care-support",
    icon: HeartHandshake,
    label: {
      en: "Labs, prescriptions & payment support",
      fr: "Laboratoires, ordonnances et aide au paiement",
      ar: "المختبرات والوصفات ودعم الدفع",
    },
    sub: {
      en: "Where to go and what to expect. Any amounts shown are estimates — confirm with the provider or your insurer.",
      fr: "Où aller et à quoi s'attendre. Les montants affichés sont des estimations — à confirmer avec le praticien ou l'assureur.",
      ar: "أين تذهبين وما المتوقع. المبالغ المعروضة تقديرية — تأكدي مع مقدم الرعاية أو شركة التأمين.",
    },
  },
];

function CareHub() {
  const { lang } = useLanguage();
  const l: Lang = lang === "fr" || lang === "ar" ? lang : "en";
  const registrationOn = isFeatureEnabled("eventRegistration");

  useEffect(() => {
    track(ANALYTICS_EVENTS.careHubOpened, { source: "nav" });
  }, []);

  return (
    <EveShell>
      <div className="rtl:text-right">
        <h1 className="font-serif text-eve-forest" style={{ fontSize: "28px" }}>
          {COPY.title[l]}
        </h1>
        <p className="mt-1 font-sans text-[14px] leading-snug text-eve-teal-dark/80">
          {COPY.intro[l]}
        </p>

        {/* A. Primary card — find trusted care */}
        <section className="mt-5 rounded-3xl border border-eve-sand bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1.5 font-sans text-[12px] font-medium text-eve-teal rtl:flex-row-reverse">
            <ShieldCheck className="h-4 w-4" />
            {COPY.trust[l]}
          </p>
          <h2 className="mt-2 font-serif text-[20px] text-eve-teal-dark">{COPY.findTitle[l]}</h2>
          <p className="mt-1 font-sans text-[14px] leading-snug text-eve-teal-dark/75">
            {COPY.findBody[l]}
          </p>
          <Link
            to="/eve/providers"
            className={cn(
              "mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-eve-teal px-5 font-sans text-[15px] font-medium text-white transition active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2",
            )}
          >
            <Search className="h-4 w-4" />
            {COPY.findCta[l]}
          </Link>
          <Link
            to="/eve/match"
            className={cn(
              "mt-2 flex min-h-[44px] items-center gap-2 font-sans text-[14px] font-medium text-eve-teal underline underline-offset-4 rtl:flex-row-reverse",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2 rounded-md",
            )}
          >
            <Stethoscope className="h-4 w-4 shrink-0" />
            {COPY.matchCta[l]}
          </Link>
        </section>

        {/* C. Your care */}
        <Group title={COPY.yourCare[l]} items={YOUR_CARE} l={l} />

        {/* D. Events & classes */}
        <section className="mt-6">
          <SectionLabel>{COPY.events[l]}</SectionLabel>
          <div className="mt-2">
            <Row
              to="/eve/events"
              icon={CalendarDays}
              label={COPY.events[l]}
              sub={
                registrationOn
                  ? {
                      en: "Browse events and classes near you",
                      fr: "Parcourez les événements et ateliers près de chez vous",
                      ar: "تصفحي الفعاليات والدروس القريبة منك",
                    }[l]
                  : COPY.eventsOff[l]
              }
            />
          </div>
        </section>

        {/* E. Care support */}
        <Group title={COPY.careSupport[l]} items={CARE_SUPPORT} l={l} />

        {/* F. Secondary tools, de-emphasized */}
        <section className="mt-6">
          <SectionLabel>{COPY.more[l]}</SectionLabel>
          <div className="mt-2 space-y-2">
            <Row
              muted
              to="/eve/passport"
              icon={ClipboardList}
              label={{ en: "Care Passport", fr: "Passeport de soins", ar: "جواز الرعاية" }[l]}
              sub={
                {
                  en: "Your records stay on your account. Sharing is not available yet.",
                  fr: "Vos documents restent sur votre compte. Le partage n'est pas encore disponible.",
                  ar: "تبقى سجلاتك في حسابك. المشاركة غير متاحة بعد.",
                }[l]
              }
            />
            <Row
              muted
              to="/eve/vendors"
              icon={ShoppingBag}
              label={
                { en: "Shops & services", fr: "Boutiques et services", ar: "المتاجر والخدمات" }[l]
              }
              sub={
                {
                  en: "Products and care services from listed partners",
                  fr: "Produits et services de partenaires référencés",
                  ar: "منتجات وخدمات من شركاء مُدرجين",
                }[l]
              }
            />
          </div>
        </section>

        {/* G. Saved — truthful empty state (no saved-care storage exists yet) */}
        <section className="mt-6">
          <SectionLabel>{COPY.saved[l]}</SectionLabel>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-eve-sand bg-eve-cream/50 p-4 rtl:flex-row-reverse rtl:text-right">
            <Bookmark className="h-5 w-5 shrink-0 text-eve-teal-dark/50" />
            <p className="font-sans text-[13px] text-eve-teal-dark/70">{COPY.savedEmpty[l]}</p>
          </div>
        </section>
      </div>
    </EveShell>
  );
}

function Group({ title, items, l }: { title: string; items: Item[]; l: Lang }) {
  return (
    <section className="mt-6">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <Row
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label[l]}
            sub={item.sub[l]}
          />
        ))}
      </div>
    </section>
  );
}

function Row({
  to,
  icon: Icon,
  label,
  sub,
  muted,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-[60px] items-center gap-3 rounded-2xl border p-3 transition-transform active:scale-[0.99] rtl:flex-row-reverse rtl:text-right",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2",
        muted ? "border-eve-sand bg-eve-cream/60" : "border-eve-sand bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          muted ? "bg-white text-eve-teal-dark/60" : "bg-eve-teal-light text-eve-teal",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-[15px] font-semibold text-eve-teal-dark">
          {label}
        </span>
        <span className="block font-sans text-[13px] leading-snug text-eve-teal-dark/70">
          {sub}
        </span>
      </span>
    </Link>
  );
}
