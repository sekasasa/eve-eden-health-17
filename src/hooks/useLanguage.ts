import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import i18n, { applyDir, setAppLanguage, AppLang, normalizeLang } from "@/i18n";

/**
 * Loads the current user's profile.language on mount, applies it to i18n,
 * and exposes a setter that persists to Supabase.
 */
export function useLanguage() {
  const [lang, setLang] = useState<AppLang>(
    normalizeLang(i18n.language) ?? "en",
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) {
        applyDir(i18n.language);
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", uid)
        .maybeSingle();
      const next = normalizeLang(p?.language);
      if (cancelled) return;
      await setAppLanguage(next);
      setLang(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function changeLanguage(next: AppLang) {
    const safe = normalizeLang(next);
    await setAppLanguage(safe);
    setLang(safe);
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) {
      await supabase
        .from("profiles")
        .update({ language: safe, language_chosen_at: new Date().toISOString() })
        .eq("id", data.user.id);
    }
  }

  return { lang, changeLanguage };
}
