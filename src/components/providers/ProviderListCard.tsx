import { Link } from "@tanstack/react-router";
import { CheckCircle2, Languages, MapPin, Sparkles, Stethoscope } from "lucide-react";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProviderFollowButton } from "./ProviderFollowButton";
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
 * Trust-first provider card: who they are and what they are verified for
 * comes before any transaction. Ratings render only when real reviews exist.
 */
export function ProviderListCard(p: ProviderListCardProps) {
  const careFocus = (p.services ?? "")
    .split(/[,;|\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  const hasRealReviews = typeof p.reviewCount === "number" && p.reviewCount > 0;

  return (
    <article className="rounded-2xl border border-eve-sand bg-white p-4 shadow-sm rtl:text-right">
      <div className="flex gap-3 rtl:flex-row-reverse">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-eve-teal font-sans text-[15px] font-medium text-white">
          {initials(p.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 rtl:flex-row-reverse">
            <h3 className="truncate font-serif text-[17px] leading-tight text-eve-forest">
              {p.name}
            </h3>
            {p.isVerified && <TrustBadge />}
          </div>

          <p className="mt-0.5 inline-flex items-center gap-1.5 font-sans text-[14px] text-eve-teal-dark/80 rtl:flex-row-reverse">
            <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {p.specialty ?? "General"}
            {p.clinicName ? ` • ${p.clinicName}` : ""}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[13px] text-eve-teal-dark/70 rtl:flex-row-reverse">
            {p.city && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rtl:flex-row-reverse",
                  p.cityMatch && "font-medium text-eve-teal-dark",
                )}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {p.city}
                {p.country ? `, ${p.country}` : ""}
              </span>
            )}
            {p.languages.length > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rtl:flex-row-reverse",
                  p.langMatch && "font-medium text-eve-teal-dark",
                )}
              >
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                {p.languages.slice(0, 3).join(", ")}
              </span>
            )}
          </div>

          {careFocus.length > 0 && (
            <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-eve-teal-dark/70">
              Care focus: {careFocus.join(" • ")}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 rtl:flex-row-reverse">
            {p.acceptingPatients && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[12px] text-emerald-700 rtl:flex-row-reverse">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Accepting patients
              </span>
            )}
            {hasRealReviews && typeof p.avgRating === "number" && (
              <span className="font-sans text-[12px] text-eve-teal-dark/70">
                {p.avgRating.toFixed(1)} ({p.reviewCount} reviews)
              </span>
            )}
          </div>

          {p.reasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 rtl:flex-row-reverse">
              {p.reasons.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-full bg-eve-teal/10 px-2 py-0.5 font-sans text-[12px] text-eve-teal-dark rtl:flex-row-reverse"
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" /> {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rtl:flex-row-reverse">
        <ProviderFollowButton providerId={p.id} />
        <Link
          to="/eve/providers/$id"
          params={{ id: p.id }}
          onClick={() =>
            track(ANALYTICS_EVENTS.providerProfileOpened, { source: "list" })
          }
          className="ms-auto inline-flex min-h-11 items-center rounded-full px-3 font-sans text-[14px] font-medium text-eve-teal hover:bg-eve-teal-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
        >
          View profile
        </Link>
        <Link to="/eve/providers/$id" params={{ id: p.id }} search={{ book: 1 }}>
          <PrimaryButton className="min-h-11 px-4 text-[14px]">Book</PrimaryButton>
        </Link>
      </div>
    </article>
  );
}
