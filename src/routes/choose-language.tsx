import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Globe } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LANGS, AppLang, setAppLanguage } from "@/i18n";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const search = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/choose-language")({
  validateSearch: (s) => search.parse(s),
  head: () => ({ meta: [{ title: "Choose your language — Eve & Eden" }] }),
  component: ChooseLanguagePage,
});

const REDIRECT_BY_TYPE: Record<string, string> = {
  mother: "/eve/home",
  provider: "/eden/dashboard",
  vendor: "/eden/vendor/dashboard",
  chw: "/chw/home",
  admin: "/admin/providers",
};

function ChooseLanguagePage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/choose-language" });
  const [selected, setSelected] = useState<AppLang>("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: if no session, bounce to /login
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) navigate({ to: "/login" });
    })();
  }, [navigate]);

  const handleContinue = async () => {
    setError(null);
    setSaving(true);
    try {
      await setAppLanguage(selected);
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Not signed in");

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", uid)
        .maybeSingle();

      await supabase
        .from("profiles")
        .update({
          language: selected,
          language_chosen_at: new Date().toISOString(),
        })
        .eq("id", uid);

      const dest =
        next ||
        REDIRECT_BY_TYPE[(profile?.user_type as string) ?? "mother"] ||
        "/eve/home";
      navigate({ to: dest });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save language");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-eve-sand px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-eve-cream text-eve-teal-dark">
          <Globe className="h-5 w-5" />
        </div>
        <SectionLabel>Welcome</SectionLabel>
        <h1 className="mt-2 font-serif text-4xl text-eve-teal">
          Choose your language
        </h1>
        <p className="mt-2 font-sans text-sm text-eve-muted">
          You can change this anytime from the language menu.
        </p>

        <div className="mt-6 space-y-2">
          {LANGS.map((l) => {
            const isSelected = selected === l.code;
            if (l.comingSoon) {
              return (
                <div
                  key={l.code}
                  className="flex items-center justify-between rounded-2xl border border-eve-muted/20 bg-eve-cream/50 px-4 py-4 opacity-70"
                >
                  <div>
                    <p className="font-sans text-base text-eve-teal-dark">
                      {l.native}
                    </p>
                    <p className="font-sans text-xs text-eve-muted">
                      {l.label}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] uppercase tracking-wide text-eve-muted">
                    Coming soon
                  </span>
                </div>
              );
            }
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setSelected(l.code)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-eve-teal bg-white shadow-sm"
                    : "border-eve-muted/20 bg-white/70 hover:bg-white"
                }`}
              >
                <div>
                  <p className="font-sans text-base text-eve-teal-dark">
                    {l.native}
                  </p>
                  <p className="font-sans text-xs text-eve-muted">{l.label}</p>
                </div>
                {isSelected && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-eve-teal text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 font-sans text-sm text-eve-rose">{error}</p>
        )}

        <PrimaryButton
          onClick={handleContinue}
          disabled={saving}
          className="mt-6 w-full"
        >
          {saving ? "Saving…" : "Continue"}
        </PrimaryButton>
      </div>
    </main>
  );
}
