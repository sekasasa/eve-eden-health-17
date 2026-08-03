import { useTranslation } from "react-i18next";
import { X, Info } from "lucide-react";
import type { CareTopic } from "@/lib/community-care-actions";

/**
 * Compact, dismissible context banner shown when the directory is opened
 * from a community topic. States plainly that results are directory
 * options, not clinical recommendations.
 */
export function CommunityContextBanner({
  topic,
  onDismiss,
}: {
  topic: CareTopic;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-eve-teal/25 bg-eve-cream px-3 py-2 text-[12px] text-eve-teal-dark">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-eve-teal" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t(`communityCare.banner.${topic}`)}</p>
        <p className="mt-0.5 text-eve-teal-dark/70">{t("communityCare.banner.disclaimer")}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("communityCare.banner.dismiss")}
        className="-me-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-eve-teal-dark/60 transition hover:text-eve-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
