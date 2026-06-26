import { Link } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import { isLanguageFullyTranslated } from "@/lib/personalization";

/**
 * Shown when the user's selected language isn't fully translated yet.
 * Always lets the user change language from the Care Preferences page.
 */
export function LanguageFallbackNotice({ language }: { language?: string | null }) {
  if (isLanguageFullyTranslated(language)) return null;
  return (
    <div className="rounded-2xl border border-eve-muted/30 bg-eve-cream/60 p-3">
      <div className="flex items-start gap-2">
        <Languages className="h-4 w-4 shrink-0 text-eve-teal" />
        <div className="flex-1">
          <p className="font-sans text-[12px] leading-snug text-eve-teal-dark">
            We're still expanding support for this language. For now, we'll show
            the closest available language.
          </p>
          <Link
            to="/eve/profile/care-preferences"
            className="mt-1 inline-block font-sans text-[11px] font-medium text-eve-teal underline"
          >
            Change language
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown above content that isn't yet localized to the user's country.
 */
export function GeneralGuidanceLabel() {
  return (
    <p className="rounded-full bg-eve-cream px-3 py-1 font-sans text-[10.5px] text-eve-muted">
      General guidance — confirm local care options with a licensed clinician.
    </p>
  );
}
