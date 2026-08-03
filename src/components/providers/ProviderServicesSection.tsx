import { useTranslation } from "react-i18next";
import { ProviderSection } from "./ProviderSection";

/**
 * Services come from the provider's own `services` field only. Nothing is
 * invented: no packages, durations, formats, or prices.
 */
export function ProviderServicesSection({ services }: { services?: string | null }) {
  const { t } = useTranslation();
  const items = (services ?? "")
    .split(/[,;|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <ProviderSection
      title={t("providerProfile.services")}
      isEmpty={items.length === 0}
      emptyText={t("providerProfile.servicesEmpty")}
    >
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((s) => (
          <li
            key={s}
            className="rounded-full border border-eve-sand bg-white px-3 py-2 font-sans text-[14px] text-eve-teal-dark"
          >
            {s}
          </li>
        ))}
      </ul>
      <p className="mt-3 font-sans text-[13px] leading-relaxed text-eve-teal-dark/70">
        {t("providerProfile.servicesNote")}
      </p>
    </ProviderSection>
  );
}
