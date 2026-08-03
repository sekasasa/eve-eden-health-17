import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  PenLine,
  Share2,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type LinkKey =
  | "appointments"
  | "patients"
  | "referrals"
  | "sharedDocs"
  | "profile"
  | "contentStudio";

const LINKS: { key: LinkKey; to: string; icon: LucideIcon }[] = [
  { key: "appointments", to: "/eden/appointments", icon: CalendarDays },
  { key: "patients", to: "/eden/patients", icon: Users },
  { key: "referrals", to: "/eden/referrals", icon: Share2 },
  { key: "sharedDocs", to: "/eden/shared-docs", icon: FileText },
  { key: "profile", to: "/eden/profile", icon: UserCog },
  { key: "contentStudio", to: "/eden/vendor/content", icon: PenLine },
];

/** Existing operational tools, kept visually secondary but one tap away. */
export function ProviderPracticeLinks({ onSelect }: { onSelect?: (key: string) => void }) {
  const { t } = useTranslation();
  return (
    <section className="mt-8 rtl:text-right">
      <h2 className="font-sans text-base font-medium text-gray-900">
        {t("providerDashboard.practiceTitle")}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.key}
            to={l.to}
            onClick={() => onSelect?.(l.key)}
            className="flex min-h-11 items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2 rtl:flex-row-reverse"
          >
            <l.icon className="h-4 w-4 shrink-0 text-eve-teal" aria-hidden="true" />
            <span className="font-sans text-[14px] text-gray-800">
              {t(`providerDashboard.link.${l.key}`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
