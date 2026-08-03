import { useTranslation } from "react-i18next";
import { ProviderFactList, ProviderSection } from "./ProviderSection";

/**
 * Appointment-related facts already loaded by the route. No implied instant
 * booking and no invented availability slots.
 */
export function ProviderAppointmentInfo({
  acceptingPatients,
  consultationFee,
  city,
  country,
}: {
  acceptingPatients?: boolean | null;
  consultationFee?: number | null;
  city?: string | null;
  country?: string | null;
}) {
  const { t } = useTranslation();
  const location = [city, country].filter(Boolean).join(", ");
  const hasFee = typeof consultationFee === "number" && consultationFee > 0;

  const items: { label: string; value: string }[] = [];
  if (acceptingPatients === true) {
    items.push({
      label: t("providerCard.accepting"),
      value: t("providerProfile.acceptingValue"),
    });
  } else if (acceptingPatients === false) {
    items.push({
      label: t("providerCard.notAccepting"),
      value: t("providerProfile.notAcceptingValue"),
    });
  }
  if (hasFee) {
    items.push({ label: t("providerCard.fee"), value: `${consultationFee} MAD` });
  }
  if (location) {
    items.push({ label: t("providerProfile.location"), value: location });
  }

  return (
    <ProviderSection
      title={t("providerProfile.availability")}
      isEmpty={items.length === 0}
      emptyText={t("providerProfile.availabilityEmpty")}
    >
      <ProviderFactList items={items} />
      <p className="mt-3 font-sans text-[13px] leading-relaxed text-eve-teal-dark/70">
        {t("providerProfile.requestNote")}
      </p>
    </ProviderSection>
  );
}
