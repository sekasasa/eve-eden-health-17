import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BadgeCheck, CheckCircle2, Languages, MapPin, Sparkles, Stethoscope } from "lucide-react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export type ProviderListCardProps = {
  id: string;
  name: string;
  specialty?: string | null;
  clinicName?: string | null;
  city?: string | null;
  country?: string | null;
  languages: string[];
  services?: string | null;
  isVerified?: boolean | null;
  acceptingPatients?: boolean | null;
  consultationFee?: number | null;
  reviewCount?: number | null;
  avgRating?: number | null;
  reasons: string[];
  cityMatch?: boolean;
  langMatch?: boolean;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "Dr"
  );
}

/**
 * Trust-first provider card. Every line renders only when the underlying
 * data is real: no invented ratings, availability or endorsements.
 */
export function ProviderListCard(p: ProviderListCardProps) {
  const { t } = useTranslation();
  const location = [p.city, p.country].filter(Boolean).join(", ");
  const languages = p.languages.filter(Boolean);
  const hasRealReviews =
    typeof p.reviewCount === "number" && p.reviewCount > 0 && typeof p.avgRating === "number";
  const hasFee = typeof p.consultationFee === "number" && p.consultationFee > 0;
  const hasAnyDetail = Boolean(location || languages.length || p.clinicName);

  return (
    <article className="rounded-2xl border border-eve-sand bg-white p-4 shadow-sm rtl:text-right">
      <div className="flex gap-3 rtl:flex-row-reverse">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-eve-teal font-sans text-[15px] font-medium text-white"
        >
          {initials(p.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 rtl:flex-row-reverse">
            <h3 className="font-serif text-[18px] leading-tight text-eve-forest">{p.name}</h3>
            {p.isVerified === true && (
              <span className="inline-flex items-center gap-1 rounded-full bg-eve-teal/10 px-2 py-0.5 font-sans text-[12px] font-medium text-eve-teal-dark rtl:flex-row-reverse">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t("providerCard.verified")}
              </span>
            )}
          </div>

          {p.specialty && (
            <p className="mt-1 inline-flex items-center gap-1.5 font-sans text-[15px] text-eve-teal-dark rtl:flex-row-reverse">
              <Stethoscope className="h-4 w-4 shrink-0" aria-hidden="true" />
              {p.specialty}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[13px] text-eve-teal-dark/75 rtl:flex-row-reverse">
            {location && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rtl:flex-row-reverse",
                  p.cityMatch && "font-medium text-eve-teal-dark",
                )}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {location}
              </span>
            )}
            {languages.length > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rtl:flex-row-reverse",
                  p.langMatch && "font-medium text-eve-teal-dark",
                )}
              >
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                {languages.slice(0, 3).join(", ")}
              </span>
            )}
            {p.clinicName && <span className="truncate">{p.clinicName}</span>}
          </div>

          {!hasAnyDetail && (
            <p className="mt-1.5 font-sans text-[13px] text-eve-teal-dark/60">
              {t("providerCard.noDetails")}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 rtl:flex-row-reverse">
            {p.acceptingPatients === true && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[13px] text-emerald-700 rtl:flex-row-reverse">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                {t("providerCard.accepting")}
              </span>
            )}
            {p.acceptingPatients === false && (
              <span className="inline-flex items-center rounded-full bg-eve-sand px-2 py-0.5 font-sans text-[13px] text-eve-teal-dark/80">
                {t("providerCard.notAccepting")}
              </span>
            )}
            {hasFee && (
              <span className="font-sans text-[13px] text-eve-teal-dark/80">
                {t("providerCard.fee")}: {p.consultationFee} MAD
              </span>
            )}
            {hasRealReviews && (
              <span className="font-sans text-[13px] text-eve-teal-dark/70">
                {p.avgRating!.toFixed(1)} ({p.reviewCount})
              </span>
            )}
          </div>

          {p.reasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 rtl:flex-row-reverse">
              {p.reasons.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-full bg-eve-rose/20 px-2 py-0.5 font-sans text-[12px] text-eve-forest rtl:flex-row-reverse"
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" /> {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex rtl:flex-row-reverse">
        <Link
          to="/eve/providers/$id"
          params={{ id: p.id }}
          onClick={() =>
            track(ANALYTICS_EVENTS.providerCardOpened, {
              provider_id: p.id,
              source: "provider_list",
            })
          }
          aria-label={`${t("providerCard.viewProfile")} — ${p.name}`}
          className="ms-auto inline-flex min-h-11 items-center rounded-full bg-eve-teal px-5 font-sans text-[15px] font-medium text-white transition hover:bg-eve-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2 active:scale-95"
        >
          {t("providerCard.viewProfile")}
        </Link>
      </div>
    </article>
  );
}
