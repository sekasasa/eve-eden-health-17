import { UserPlus } from "lucide-react";
import { eveToast } from "@/lib/eve-toast";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Following providers has no backend yet. The control stays visible so the
 * network intent is clear, but it never claims a follow was saved.
 */
export function ProviderFollowButton({
  providerId,
  size = "sm",
  className,
}: {
  providerId: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Following opens with the community pilot"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // No-op: there is no follow backend. Record the intent only.
        track(ANALYTICS_EVENTS.providerFollowClicked, {
          supported: false,
          provider_known: Boolean(providerId),
        });
        eveToast.info("Following opens with the community pilot — nothing was saved yet.");
      }}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-eve-teal/30 bg-white px-3 font-sans text-[13px] font-medium text-eve-teal-dark/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2 active:scale-95",
        size === "md" && "px-4 text-[14px]",
        className,
      )}
    >
      <UserPlus className="h-4 w-4" aria-hidden="true" />
      Follow (soon)
    </button>
  );
}
