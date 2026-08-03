import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { FEED_TABS, type FeedTabKey } from "@/lib/community-seed";

/**
 * Feed tabs. Unbacked tabs stay selectable but the feed shows a truthful
 * "coming with the community pilot" state instead of fabricated results.
 */
export function CommunityTabs({
  value,
  onChange,
}: {
  value: FeedTabKey;
  onChange: (tab: FeedTabKey) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        role="tablist"
        aria-label={t("community.tabsLabel")}
        className="flex gap-2 pb-1 rtl:flex-row-reverse"
      >
        {FEED_TABS.map((tabDef) => {
          const isActive = value === tabDef.key;
          return (
            <button
              key={tabDef.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tabDef.key)}
              className={cn(
                "min-h-11 shrink-0 rounded-full px-4 text-[14px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2",
                isActive
                  ? "bg-eve-teal text-white"
                  : "bg-eve-cream text-eve-teal-dark/75 hover:bg-eve-sand",
              )}
            >
              {t(`community.tabs.${tabDef.key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
