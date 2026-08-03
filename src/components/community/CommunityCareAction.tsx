import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { careActionForCategory } from "@/lib/community-care-actions";
import type { CategoryKey } from "@/lib/community-seed";

/**
 * Secondary, contextual link from a community topic into the provider
 * directory. Only the category enum travels — never post text.
 */
export function CommunityCareAction({ category }: { category: CategoryKey }) {
  const { t } = useTranslation();
  const action = careActionForCategory(category);
  if (!action) return null;

  return (
    <div className="mt-3 border-t border-eve-sand pt-3">
      <Link
        to="/eve/providers"
        search={{ source: "community", topic: action.topic }}
        onClick={() =>
          track(ANALYTICS_EVENTS.communityCareActionSelected, {
            topic: action.topic,
            destination: "provider_directory",
          })
        }
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-eve-teal/30 bg-white px-3 py-2 text-[13px] font-medium text-eve-teal-dark transition hover:bg-eve-teal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
      >
        <Compass className="h-4 w-4 text-eve-teal" aria-hidden="true" />
        <span>{t(action.labelKey)}</span>
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
      </Link>
      <p className="mt-1 text-[12px] text-eve-teal-dark/60">{t("communityCare.actionNote")}</p>
    </div>
  );
}
