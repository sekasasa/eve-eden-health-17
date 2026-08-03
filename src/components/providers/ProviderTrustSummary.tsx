import { BadgeCheck, Building2, Clock, Users } from "lucide-react";

/**
 * Trust summary. Every row renders only when the underlying data is real.
 * Nothing here is inferred, averaged, or filled with placeholders.
 */
export function ProviderTrustSummary({
  isVerified,
  credentials,
  clinicName,
  yearsInPractice,
}: {
  isVerified?: boolean | null;
  credentials?: string | null;
  clinicName?: string | null;
  yearsInPractice?: number | null;
}) {
  const rows: { icon: typeof BadgeCheck; label: string; value: string }[] = [];

  if (isVerified) {
    rows.push({
      icon: BadgeCheck,
      label: "Listing verified",
      value: "Our team checked this listing's identity and contact details.",
    });
  }
  if (credentials?.trim()) {
    rows.push({ icon: BadgeCheck, label: "Credentials shared", value: credentials.trim() });
  }
  if (clinicName?.trim()) {
    rows.push({ icon: Building2, label: "Clinic", value: clinicName.trim() });
  }
  if (typeof yearsInPractice === "number" && yearsInPractice > 0) {
    rows.push({
      icon: Clock,
      label: "Experience",
      value: `${yearsInPractice} years in practice`,
    });
  }

  return (
    <section className="mt-6 rtl:text-right">
      <h2 className="font-serif text-lg text-eve-forest">Trust summary</h2>
      {rows.length === 0 ? (
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-eve-teal-dark/75">
          This provider has not shared verified credentials or clinic details with us
          yet. Ask them directly before booking.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-start gap-2.5 rounded-2xl border border-eve-sand bg-white p-3 rtl:flex-row-reverse"
            >
              <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-eve-teal" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-sans text-[13px] font-semibold text-eve-forest">
                  {r.label}
                </p>
                <p className="font-sans text-[14px] leading-relaxed text-eve-teal-dark/80">
                  {r.value}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-start gap-2.5 rounded-2xl border border-dashed border-eve-muted/30 bg-eve-cream/50 p-3 rtl:flex-row-reverse">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-eve-teal" aria-hidden="true" />
        <p className="font-sans text-[13px] leading-relaxed text-eve-teal-dark/80">
          Community participation opens with our pilot. No answers, follows, or
          community activity are recorded for this provider yet.
        </p>
      </div>
    </section>
  );
}

/** Ratings and reviews are not collected yet — never fabricate them. */
export function ProviderReviewsNotice({
  avgRating,
  reviewCount,
}: {
  avgRating?: number | null;
  reviewCount?: number | null;
}) {
  const hasRealReviews = typeof reviewCount === "number" && reviewCount > 0;
  return (
    <section className="mt-6 rtl:text-right">
      <h2 className="font-serif text-lg text-eve-forest">Reviews</h2>
      {hasRealReviews && typeof avgRating === "number" ? (
        <p className="mt-2 font-sans text-[14px] text-eve-teal-dark/80">
          {avgRating.toFixed(1)} from {reviewCount} recorded reviews.
        </p>
      ) : (
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-eve-teal-dark/75">
          Reviews coming after launch. We do not show ratings until real mothers
          have left them.
        </p>
      )}
    </section>
  );
}
