import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardList,
  FlaskConical,
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
import { useEffect } from "react";

export const Route = createFileRoute("/eve/care")({
  head: () => ({
    meta: [
      { title: "Care Hub — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Find verified maternal care, manage appointments and records, and browse events and support tools in one place.",
      },
      { property: "og:title", content: "Care Hub — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Find verified maternal care, manage appointments and records, and browse events and support tools in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareHub,
});

type Item = {
  to: string;
  params?: Record<string, string>;
  icon: React.ComponentType<{ className?: string }>;
  label: Record<"en" | "fr" | "ar", string>;
  sub: Record<"en" | "fr" | "ar", string>;
};

const FIND_CARE: Item[] = [
  {
    to: "/eve/providers",
    icon: Search,
    label: {
      en: "Search providers",
      fr: "Rechercher des praticiens",
      ar: "ابحثي عن مقدمي الرعاية",
    },
    sub: {
      en: "Verified clinicians, midwives and doulas",
      fr: "Cliniciens, sages-femmes et doulas vérifiés",
      ar: "أطباء وقابلات ودولا موثوقون",
    },
  },
  {
    to: "/eve/match",
    icon: Stethoscope,
    label: { en: "Guided match", fr: "Orientation guidée", ar: "مطابقة موجهة" },
    sub: {
      en: "Answer a few questions and we rank the best fit",
      fr: "Répondez à quelques questions et nous classons les meilleurs choix",
      ar: "أجيبي عن أسئلة قليلة ونرتّب الأنسب لك",
    },
  },
  {
    to: "/eve/match/labs",
    icon: FlaskConical,
    label: { en: "Labs & imaging", fr: "Laboratoires et imagerie", ar: "المختبرات والتصوير" },
    sub: {
      en: "Where to get tests done",
      fr: "Où faire vos examens",
      ar: "أين تجرين الفحوصات",
    },
  },
];

const YOUR_CARE: Item[] = [
  {
    to: "/eve/appointments",
    icon: CalendarDays,
    label: { en: "Appointments", fr: "Rendez-vous", ar: "المواعيد" },
    sub: {
      en: "Upcoming and past visits",
      fr: "Visites à venir et passées",
      ar: "الزيارات القادمة والسابقة",
    },
  },
  {
    to: "/eve/passport",
    icon: ClipboardList,
    label: { en: "Care Passport", fr: "Passeport de soins", ar: "جواز الرعاية" },
    sub: {
      en: "Your records, kept on your account",
      fr: "Vos documents, conservés sur votre compte",
      ar: "سجلاتك محفوظة في حسابك",
    },
  },
  {
    to: "/eve/care-support",
    icon: HeartHandshake,
    label: { en: "Support tools", fr: "Outils de soutien", ar: "أدوات الدعم" },
    sub: {
      en: "Medications, payments and coverage help",
      fr: "Médicaments, paiements et couverture",
      ar: "الأدوية والمدفوعات والتغطية",
    },
  },
];

const DISCOVER: Item[] = [
  {
    to: "/eve/events",
    icon: CalendarDays,
    label: { en: "Events & workshops", fr: "Événements et ateliers", ar: "الفعاليات وورش العمل" },
    sub: {
      en: "Meet providers and other mothers",
      fr: "Rencontrez praticiens et autres mères",
      ar: "التقي بمقدمي الرعاية وأمهات أخريات",
    },
  },
  {
    to: "/eve/vendors",
    icon: ShoppingBag,
    label: { en: "Shop & services", fr: "Boutique et services", ar: "المتجر والخدمات" },
    sub: {
      en: "Vetted products and care services",
      fr: "Produits et services vérifiés",
      ar: "منتجات وخدمات مُراجعة",
    },
  },
  {
    to: "/eve/referrals",
    icon: Users,
    label: { en: "Referrals", fr: "Orientations", ar: "الإحالات" },
    sub: {
      en: "Track referrals shared with you",
      fr: "Suivez les orientations partagées",
      ar: "تابعي الإحالات المشتركة معك",
    },
  },
];

function CareHub() {
  const { lang } = useLanguage();
  const l = (lang === "fr" || lang === "ar" ? lang : "en") as "en" | "fr" | "ar";

  useEffect(() => {
    track(ANALYTICS_EVENTS.careHubOpened, { source: "nav" });
  }, []);

  const headings = {
    en: { title: "Care", find: "Find care", yours: "Your care", discover: "Discover", trust: "We only list providers we have verified." },
    fr: { title: "Soins", find: "Trouver des soins", yours: "Vos soins", discover: "Découvrir", trust: "Nous ne listons que des praticiens vérifiés." },
    ar: { title: "الرعاية", find: "ابحثي عن رعاية", yours: "رعايتك", discover: "اكتشفي", trust: "نعرض فقط مقدمي الرعاية الذين تحققنا منهم." },
  }[l];

  return (
    <EveShell>
      <div className="rtl:text-right">
        <h1 className="font-serif text-eve-forest" style={{ fontSize: "26px" }}>
          {headings.title}
        </h1>
        <p className="mt-1 inline-flex items-center gap-1.5 font-sans text-[13px] text-eve-teal-dark/70 rtl:flex-row-reverse">
          <ShieldCheck className="h-4 w-4 text-eve-teal" />
          {headings.trust}
        </p>

        <Group title={headings.find} items={FIND_CARE} l={l} />
        <Group title={headings.yours} items={YOUR_CARE} l={l} />
        <Group title={headings.discover} items={DISCOVER} l={l} />
      </div>
    </EveShell>
  );
}

function Group({
  title,
  items,
  l,
}: {
  title: string;
  items: Item[];
  l: "en" | "fr" | "ar";
}) {
  return (
    <section className="mt-6">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-eve-sand bg-white p-3 transition-transform active:scale-[0.99] rtl:flex-row-reverse rtl:text-right"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-eve-teal-light text-eve-teal">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-sans text-[15px] font-semibold text-eve-teal-dark">
                {item.label[l]}
              </span>
              <span className="block font-sans text-[13px] leading-snug text-eve-teal-dark/70">
                {item.sub[l]}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
