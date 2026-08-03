import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type OpportunityItem = {
  id: string;
  scheduledAt: string;
  status: string | null;
  /** Appointment type as stored; may be absent. */
  type: string | null;
};

/**
 * Incoming appointment requests already loaded by the route. These are
 * requests, not "leads" — no CRM stages or attribution are implied.
 */
export function ProviderOpportunityList({
  items,
  loading,
}: {
  items: OpportunityItem[];
  loading?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white rtl:text-right">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 rtl:flex-row-reverse">
        <h2 className="font-sans text-base font-medium text-gray-900">
          {t("providerDashboard.opportunitiesTitle")}
        </h2>
        <Link
          to="/eden/appointments"
          className="min-h-11 font-sans text-[13px] font-medium text-eve-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
        >
          {t("providerDashboard.manageRequests")}
        </Link>
      </div>
      {loading ? (
        <div className="p-5">
          <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
        </div>
      ) : items.length === 0 ? (
        <p className="px-5 py-8 text-center font-sans text-[14px] leading-relaxed text-gray-500">
          {t("providerDashboard.opportunitiesEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-3 px-5 py-3 rtl:flex-row-reverse"
            >
              <div className="min-w-0 rtl:text-right">
                <p className="font-sans text-[14px] font-medium text-gray-900">
                  {o.type ?? t("providerDashboard.requestGeneric")}
                </p>
                <p className="font-sans text-[12px] text-gray-500">
                  {new Date(o.scheduledAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 font-sans text-[12px] capitalize",
                  o.status === "confirmed"
                    ? "bg-eve-teal/10 text-eve-teal-dark"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {o.status ?? "pending"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
