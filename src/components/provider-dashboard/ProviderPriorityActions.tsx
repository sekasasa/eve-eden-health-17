import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

export type PriorityActionKey =
  | "getVerified"
  | "completeProfile"
  | "addServices"
  | "respondRequests"
  | "publishContent";

export type PriorityAction = {
  key: PriorityActionKey;
  /** Existing route only — no invented destinations. */
  to: string;
  done: boolean;
};

/**
 * Checklist derived from real account state. Every row links to a route that
 * already exists; nothing here claims unbuilt functionality.
 */
export function ProviderPriorityActions({
  actions,
  onSelect,
}: {
  actions: PriorityAction[];
  onSelect?: (key: PriorityActionKey) => void;
}) {
  const { t } = useTranslation();
  if (actions.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 rtl:text-right">
      <h2 className="font-sans text-base font-medium text-gray-900">
        {t("providerDashboard.actionsTitle")}
      </h2>
      <p className="mt-0.5 font-sans text-[13px] text-gray-500">
        {t("providerDashboard.actionsSubtitle")}
      </p>
      <ul className="mt-4 space-y-2">
        {actions.map((a) => (
          <li key={a.key}>
            <Link
              to={a.to}
              onClick={() => onSelect?.(a.key)}
              className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2 rtl:flex-row-reverse"
            >
              {a.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-eve-teal" aria-hidden="true" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-gray-300" aria-hidden="true" />
              )}
              <span className="flex-1 font-sans text-[14px] text-gray-800">
                {t(`providerDashboard.action.${a.key}`)}
              </span>
              <span className="font-sans text-[13px] font-medium text-eve-teal">
                {t("providerDashboard.open")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
