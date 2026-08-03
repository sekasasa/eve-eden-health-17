import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Languages as LanguagesIcon,
  MapPin,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export type ProviderProfileHeaderProps = {
  name?: string | null;
  specialty?: string | null;
  clinicName?: string | null;
  city?: string | null;
  country?: string | null;
  languages?: string[] | null;
  isVerified?: boolean | null;
  acceptingPatients?: boolean | null;
  consultationFee?: number | null;
  bio?: string | null;
  /** Existing booking behaviour, owned by the route. */
  onRequestAppointment: () => void;
};

function initials(name?: string | null) {
  if (!name) return "Dr";
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
 * Trust-first profile header. Purely presentational: it receives already
 * loaded provider fields and renders a row only when that field is real.
 * Nothing here is inferred, averaged, or filled with placeholder data.
 */
export function ProviderProfileHeader(p: ProviderProfileHeaderProps) {
  const { t } = useTranslation();
  const location = [p.city, p.country].filter(Boolean).join(", ");
  const languages = (p.languages ?? []).filter(Boolean);
  const clinic = p.clinicName?.trim();
  const bio = p.bio?.trim();
  const hasFee = typeof p.consultationFee === "number" && p.consultationFee > 0;

  const facts: { icon: typeof BadgeCheck; label: string; value: string }[] = [];
  if (p.isVerified === true) {
    facts.push({
      icon: BadgeCheck,
      label: t("providerProfile.verifiedCredentials"),
      value: t("providerProfile.verifiedCredentialsValue"),
    });
  }
  if (languages.length > 0) {
    facts.push({
      icon: LanguagesIcon,
      label: t("providerCard.languages"),
      value: languages.join(", "),
    });
  }
  if (clinic) {
    facts.push({ icon: Building2, label: t("providerCard.clinic"), value: clinic });
  }
  if (location) {
    facts.push({ icon: MapPin, label: t("providerProfile.location"), value: location });
  }
  if (p.acceptingPatients === true) {
    facts.push({
      icon: CheckCircle2,
      label: t("providerCard.accepting"),
      value: t("providerProfile.acceptingValue"),
    });
  } else if (p.acceptingPatients === false) {
    facts.push({
      icon: CheckCircle2,
      label: t("providerCard.notAccepting"),
      value: t("providerProfile.notAcceptingValue"),
    });
  }
  if (hasFee) {
    facts.push({
      icon: Wallet,
      label: t("providerCard.fee"),
      value: `${p.consultationFee} MAD`,
    });
  }

  return (
    <header className="-mx-5 rounded-b-3xl bg-eve-cream px-5 pb-6 pt-4 rtl:text-right">
      <div className="flex gap-3 rtl:flex-row-reverse">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-eve-teal font-sans text-lg font-medium text-white"
        >
          {initials(p.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] leading-tight text-eve-forest">
            {p.name ?? t("providerProfile.unnamed")}
          </h1>
          {p.specialty && (
            <p className="mt-0.5 font-sans text-[15px] text-eve-teal-dark">{p.specialty}</p>
          )}
          {p.isVerified === true && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-eve-teal/10 px-2.5 py-1 font-sans text-[13px] font-medium text-eve-teal-dark rtl:flex-row-reverse">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              {t("providerCard.verified")}
            </span>
          )}
        </div>
      </div>

      {facts.length > 0 ? (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {facts.map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-2.5 rounded-2xl border border-eve-sand bg-white p-3 rtl:flex-row-reverse"
            >
              <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-eve-teal" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="font-sans text-[13px] font-semibold text-eve-forest">{f.label}</dt>
                <dd className="font-sans text-[14px] leading-relaxed text-eve-teal-dark/80">
                  {f.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 font-sans text-[14px] leading-relaxed text-eve-teal-dark/75">
          {t("providerProfile.noDetails")}
        </p>
      )}

      {bio && (
        <section className="mt-4">
          <h2 className="font-sans text-[13px] font-semibold uppercase tracking-wide text-eve-muted">
            {t("providerProfile.about")}
          </h2>
          <p className="mt-1 font-sans text-[15px] leading-relaxed text-eve-teal-dark/85">
            {bio.length > 260 ? `${bio.slice(0, 260).trimEnd()}…` : bio}
          </p>
        </section>
      )}

      <PrimaryButton onClick={p.onRequestAppointment} className="mt-4 min-h-11 w-full">
        {t("providerProfile.requestAppointment")}
      </PrimaryButton>
      <p className="mt-2 font-sans text-[13px] leading-relaxed text-eve-teal-dark/70">
        {t("providerProfile.requestNote")}
      </p>
    </header>
  );
}
