import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/utils";
import { buildConsentRecord } from "@/lib/consent";

export const Route = createFileRoute("/choose-role")({
  head: () => ({
    meta: [
      { title: "Choose your role — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Tell Eve & Eden Health how you will use the service so we show the right experience for you.",
      },
      { property: "og:title", content: "Choose your role — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Select whether you are seeking care, a provider, or a vendor on Eve & Eden Health.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChooseRolePage,
});

type UserType = "mother" | "provider" | "vendor";

const OPTIONS: { value: UserType; label: string; hint: string; redirect: string }[] = [
  {
    value: "mother",
    label: "I am seeking care",
    hint: "Find providers, plan visits and get guidance.",
    redirect: "/eve/onboarding",
  },
  {
    value: "provider",
    label: "I am a provider",
    hint: "Manage your practice profile and referrals.",
    redirect: "/eden/onboarding",
  },
  {
    value: "vendor",
    label: "I am a vendor",
    hint: "List products and services for families.",
    redirect: "/eden/vendor/onboarding",
  },
];

function ChooseRolePage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        navigate({ to: "/login" });
        return;
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async () => {
    if (!userType) {
      setError("Choose one option to continue.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) throw new Error("Your session expired. Please sign in again.");
      const { error: pErr } = await supabase.from("profiles").upsert({
        id: user.id,
        user_type: userType,
        ...buildConsentRecord(),
      });
      if (pErr) throw pErr;
      const dest = OPTIONS.find((o) => o.value === userType)!.redirect;
      navigate({ to: dest });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your choice.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-eve-sand px-6 py-12">
      <div className="w-full max-w-md">
        <SectionLabel>One more step</SectionLabel>
        <h1 className="mt-2 font-serif text-4xl text-eve-teal">How will you use Eve &amp; Eden?</h1>
        <p className="mt-2 font-sans text-sm text-eve-muted">
          We need this to show you the right experience. Nothing is assumed for you.
        </p>

        {checking ? (
          <p className="mt-8 font-sans text-sm text-eve-muted">Loading…</p>
        ) : (
          <>
            <div role="radiogroup" aria-label="Account type" className="mt-6 space-y-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={userType === opt.value}
                  onClick={() => setUserType(opt.value)}
                  className={cn(
                    "block w-full min-h-11 rounded-2xl border px-4 py-3 text-left font-sans transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal",
                    userType === opt.value
                      ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
                      : "border-eve-muted/30 bg-white text-eve-muted hover:border-eve-teal/50",
                  )}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="mt-0.5 block text-xs opacity-80">{opt.hint}</span>
                </button>
              ))}
            </div>

            {error && (
              <p role="alert" className="mt-3 font-sans text-sm text-eve-rose">
                {error}
              </p>
            )}

            <PrimaryButton
              onClick={handleContinue}
              disabled={!userType || saving}
              className="mt-6 w-full"
            >
              {saving ? "Saving…" : "Continue"}
            </PrimaryButton>
          </>
        )}
      </div>
    </main>
  );
}
