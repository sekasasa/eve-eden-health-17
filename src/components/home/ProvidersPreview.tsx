import { Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, MapPin } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { useProviderPreview } from "@/hooks/useProviderPreview";
import type { CarePrefs } from "@/lib/personalization";

/** Real, display-eligible providers only. Strong empty state otherwise. */
export function ProvidersPreview({
  prefs,
  lang,
}: {
  prefs: CarePrefs;
  lang: "en" | "fr" | "ar";
}) {
  const navigate = useNavigate();
  const { providers, loading } = useProviderPreview(prefs, 3);

  const copy = {
    en: {
      label: "Providers for you",
      all: "See all",
      empty: "No verified providers to show yet",
      emptyBody:
        "We only list providers we have verified. Search the full directory or tell us what you need.",
      cta: "Search care",
      verified: "Verified",
    },
    fr: {
      label: "Praticiens pour vous",
      all: "Tout voir",
      empty: "Aucun praticien vérifié pour l'instant",
      emptyBody:
        "Nous ne listons que des praticiens vérifiés. Consultez l'annuaire complet ou dites-nous ce qu'il vous faut.",
      cta: "Rechercher des soins",
      verified: "Vérifié",
    },
    ar: {
      label: "مقدمو رعاية لك",
      all: "عرض الكل",
      empty: "لا يوجد مقدمو رعاية موثوقون بعد",
      emptyBody:
        "نعرض فقط مقدمي الرعاية الذين تحققنا منهم. تصفحي الدليل الكامل أو أخبرينا بما تحتاجين.",
      cta: "ابحثي عن رعاية",
      verified: "موثوق",
    },
  }[lang];

  return (
    <section className="mt-5 px-3 rtl:text-right">
      <div className="flex items-center justify-between gap-2 rtl:flex-row-reverse">
        <SectionLabel>{copy.label}</SectionLabel>
        <Link to="/eve/providers" className="font-sans text-[13px] font-medium text-eve-teal">
          {copy.all}
        </Link>
      </div>

      {loading ? (
        <div className="mt-2 h-20 w-full animate-pulse rounded-2xl bg-eve-muted/20" />
      ) : providers.length === 0 ? (
        <div className="mt-2 rounded-2xl border border-dashed border-eve-teal/30 bg-white p-4">
          <p className="font-sans text-[15px] font-semibold text-eve-teal-dark">{copy.empty}</p>
          <p className="mt-1 font-sans text-[13px] leading-relaxed text-eve-teal-dark/70">
            {copy.emptyBody}
          </p>
          <Link
            to="/eve/providers"
            className="mt-3 inline-flex min-h-11 items-center rounded-full bg-eve-teal px-4 font-sans text-[13px] font-medium text-white"
          >
            {copy.cta}
          </Link>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                track(ANALYTICS_EVENTS.providerPreviewOpened, {
                  source: "home",
                  specialty: p.specialty ?? "unknown",
                });
                navigate({ to: "/eve/providers/$id", params: { id: p.id } });
              }}
              className="block w-full rounded-2xl border border-eve-sand bg-white p-3 text-left rtl:text-right"
            >
              <div className="flex items-center gap-2 rtl:flex-row-reverse">
                <p className="font-sans text-[15px] font-semibold text-eve-teal-dark">
                  {p.full_name}
                </p>
                {p.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-eve-teal-light px-2 py-0.5 font-sans text-[11px] font-semibold text-eve-teal">
                    <BadgeCheck className="h-3 w-3" /> {copy.verified}
                  </span>
                )}
              </div>
              {p.specialty && (
                <p className="mt-0.5 font-sans text-[13px] text-eve-teal-dark/80">{p.specialty}</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 font-sans text-[12px] text-eve-teal-dark/70 rtl:flex-row-reverse">
                {p.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.city}
                  </span>
                )}
                {p.languages?.length ? <span>{p.languages.slice(0, 3).join(" · ")}</span> : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
