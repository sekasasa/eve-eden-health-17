import { useEffect, useState } from "react";
import { hydrateIntakeFromCloud, readIntake, type MatchIntake } from "@/lib/match-store";

/**
 * Returns the user's saved care profile (from the personalization survey).
 * Reads sessionStorage immediately, then hydrates from cloud on mount.
 */
export function useSavedProfile() {
  const [profile, setProfile] = useState<MatchIntake>(() =>
    typeof window === "undefined" ? {} : readIntake(),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await hydrateIntakeFromCloud();
      if (!cancelled) {
        setProfile(p ?? {});
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, hydrated };
}
