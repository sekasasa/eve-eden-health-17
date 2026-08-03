import { useTranslation } from "react-i18next";
import { flagOffCopy, isFeatureEnabled } from "@/lib/flags";

/**
 * Truthful status shown while the community has no moderated posting backend.
 * Never claims a moderator or clinician is reviewing content.
 */
export function CommunityReadOnlyNotice() {
  const { t } = useTranslation();
  const moderationEnabled = isFeatureEnabled("communityModeration");
  return (
    <div
      role="status"
      className="rounded-2xl border border-eve-sand bg-eve-cream/60 px-4 py-3 rtl:text-right"
    >
      <p className="text-[13px] font-semibold text-eve-teal-dark">
        {t("community.readOnlyTitle")}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-eve-teal-dark/75">
        {flagOffCopy("communityPosting")}
      </p>
      {!moderationEnabled && (
        <p className="mt-1 text-[13px] leading-relaxed text-eve-teal-dark/75">
          {t("community.readOnlyBody")}
        </p>
      )}
    </div>
  );
}
