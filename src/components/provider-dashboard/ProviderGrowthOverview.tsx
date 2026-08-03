import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type GrowthMetric = {
  /** Stable enum key, used for i18n and analytics — never free text. */
  key: "pendingRequests" | "upcomingConfirmed" | "peopleSeen30d";
  value: number;
};

/**
 * Growth cards for metrics we can truthfully derive from persisted
 * appointment data. Metrics we do not track (profile views, followers,
 * reach, revenue) are never rendered as 0 — they are described in the
 * setup notice below the grid instead.
 */
export function ProviderGrowthOverview({
  metrics,
  loading,
}: {
  metrics: GrowthMetric[];
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section className="mt-6 rtl:text-right">
      <h2 className="font-sans text-base font-medium text-gray-900">
        {t("providerDashboard.growthTitle")}
      </h2>
      <p className="mt-0.5 font-sans text-[13px] text-gray-500">
        {t("providerDashboard.growthSubtitle")}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.key} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="font-sans text-[13px] text-gray-500">
              {t(`providerDashboard.metric.${m.key}`)}
            </p>
            {loading ? (
              <div className="mt-3 h-8 w-14 animate-pulse rounded bg-gray-100" />
            ) : (
              <p className="mt-2 font-sans text-[32px] font-bold leading-none text-eve-forest">
                {m.value}
              </p>
            )}
            <p className="mt-2 font-sans text-[12px] leading-relaxed text-gray-500">
              {t(`providerDashboard.metricNote.${m.key}`)}
            </p>
          </div>
        ))}
      </div>
      <p
        className={cn(
          "mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4",
          "font-sans text-[13px] leading-relaxed text-gray-600",
        )}
      >
        {t("providerDashboard.growthComingSoon")}
      </p>
    </section>
  );
}
