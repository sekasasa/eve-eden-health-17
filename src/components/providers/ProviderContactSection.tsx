import { useTranslation } from "react-i18next";
import { ProviderFactList, ProviderSection } from "./ProviderSection";

/**
 * Clinic and location only. Contact channels are intentionally not claimed:
 * the profile does not expose phone, email, or messaging fields.
 */
export function ProviderContactSection({
  clinicName,
  city,
  country,
}: {
  clinicName?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  const { t } = useTranslation();
  const clinic = clinicName?.trim();
  const location = [city, country].filter(Boolean).join(", ");

  const items: { label: string; value: string }[] = [];
  if (clinic) items.push({ label: t("providerCard.clinic"), value: clinic });
  if (location) items.push({ label: t("providerProfile.location"), value: location });

  return (
    <ProviderSection
      title={t("providerProfile.contact")}
      isEmpty={items.length === 0}
      emptyText={t("providerProfile.contactEmpty")}
    >
      <ProviderFactList items={items} />
    </ProviderSection>
  );
}
