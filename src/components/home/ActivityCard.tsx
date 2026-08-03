import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";

/**
 * Activity card. There is no notification/activity backend yet, so this is a
 * truthful first-use state — it never invents activity.
 */
export function ActivityCard({ lang }: { lang: "en" | "fr" | "ar" }) {
  const copy = {
    en: {
      label: "Your activity",
      title: "Nothing new yet",
      body: "When you save a provider, book a visit, or the community pilot opens, updates appear here.",
      cta: "Browse the community",
    },
    fr: {
      label: "Votre activité",
      title: "Rien de nouveau",
      body: "Dès que vous enregistrez un praticien, réservez une visite ou que le pilote communautaire ouvre, les mises à jour apparaîtront ici.",
      cta: "Voir la communauté",
    },
    ar: {
      label: "نشاطك",
      title: "لا جديد بعد",
      body: "عندما تحفظين مقدم رعاية أو تحجزين موعداً أو يفتح مجتمع التجربة، ستظهر التحديثات هنا.",
      cta: "تصفحي المجتمع",
    },
  }[lang];

  return (
    <section className="mx-3 mt-3 rounded-2xl border border-eve-sand bg-white p-4 rtl:text-right">
      <div className="flex items-center gap-2 rtl:flex-row-reverse">
        <Bell className="h-4 w-4 text-eve-teal" />
        <SectionLabel>{copy.label}</SectionLabel>
      </div>
      <p className="mt-1.5 font-sans text-[15px] font-semibold text-eve-teal-dark">{copy.title}</p>
      <p className="mt-1 font-sans text-[13px] leading-relaxed text-eve-teal-dark/70">
        {copy.body}
      </p>
      <Link
        to="/eve/community"
        className="mt-2 inline-block font-sans text-[13px] font-medium text-eve-teal underline-offset-2 hover:underline"
      >
        {copy.cta}
      </Link>
    </section>
  );
}
