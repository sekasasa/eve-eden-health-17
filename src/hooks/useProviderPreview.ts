import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isDisplayableProvider,
  matchProviders,
  type MatchProviderRecord,
} from "@/lib/provider-matching";
import type { CarePrefs } from "@/lib/personalization";

const SELECT =
  "id, full_name, specialty, clinic_name, city, country, bio, languages, services, credentials, avg_rating, review_count, consultation_fee_mad, is_verified, accepting_patients, status, review_status";

/**
 * Small read used by the Home "Providers for you" preview.
 * Ranking only — saved preferences never act as silent hard filters.
 */
export function useProviderPreview(prefs: CarePrefs, limit = 3) {
  const [providers, setProviders] = useState<MatchProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("providers").select(SELECT).limit(120);
      if (cancelled) return;
      const rows = ((data ?? []) as unknown as MatchProviderRecord[]).filter(
        isDisplayableProvider,
      );
      const match = matchProviders(rows, {
        city: prefs.city,
        country: prefs.country,
        languages: [prefs.language, prefs.secondary_language].filter(
          (l): l is string => Boolean(l),
        ),
        dialect: prefs.dialect,
      });
      setProviders(match.results.slice(0, limit));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [prefs.city, prefs.country, prefs.language, prefs.secondary_language, prefs.dialect, limit]);

  return { providers, loading };
}
