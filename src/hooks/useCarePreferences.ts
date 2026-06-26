import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EMPTY_PREFS, type CarePrefs } from "@/lib/personalization";

/**
 * Hook: returns the mother's saved Care Preferences, used everywhere we
 * personalize the experience. Reads from `mothers` row for the signed-in user.
 * Returns EMPTY_PREFS during SSR / signed-out.
 */
export function useCarePreferences(): { prefs: CarePrefs; loading: boolean } {
  const [prefs, setPrefs] = useState<CarePrefs>(EMPTY_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("mothers")
        .select(
          "region,country,city,language,secondary_language,dialect,stage,care_setting,cultural_prefs,dietary_prefs,birth_prefs,personalize_opt",
        )
        .eq("user_id", uid)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPrefs({
          region: (data.region as string | null) ?? null,
          country: (data.country as string | null) ?? null,
          city: (data.city as string | null) ?? null,
          language: (data.language as string | null) ?? null,
          secondary_language: (data.secondary_language as string | null) ?? null,
          dialect: (data.dialect as string | null) ?? null,
          stage: (data.stage as string | null) ?? null,
          care_setting: (data.care_setting as string | null) ?? null,
          cultural_prefs: (data.cultural_prefs as string[] | null) ?? [],
          dietary_prefs: (data.dietary_prefs as string[] | null) ?? [],
          birth_prefs: (data.birth_prefs as string[] | null) ?? [],
          personalize_opt: (data.personalize_opt as string | null) ?? null,
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { prefs, loading };
}
