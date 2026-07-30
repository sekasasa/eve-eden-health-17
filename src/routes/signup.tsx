import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildConsentRecord,
  PASSWORD_MIN_LENGTH,
  passwordIssues,
} from "@/lib/consent";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Create an Eve & Eden Health account as a mother, provider or vendor to navigate maternal care with guidance you can trust.",
      },
      { property: "og:title", content: "Create your account — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Choose your role and join Eve & Eden Health — maternal care navigation for mothers, providers and vendors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // `type` stays optional: we never silently assume a role.
  validateSearch: (s: Record<string, unknown>): { type?: UserType } => ({
    type:
      s.type === "provider" || s.type === "vendor" || s.type === "mother"
        ? (s.type as UserType)
        : undefined,
  }),
  component: SignupPage,
});

type UserType = "mother" | "provider" | "vendor";

const TYPE_OPTIONS: { value: UserType; label: string; redirect: string }[] = [
  { value: "mother", label: "I am seeking care", redirect: "/eve/onboarding" },
  { value: "provider", label: "I am a provider", redirect: "/eden/onboarding" },
  { value: "vendor", label: "I am a vendor", redirect: "/eden/vendor/onboarding" },
];

const PENDING_TYPE_KEY = "eve_pending_user_type";

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  // No silent default: the role is null until it is explicitly chosen here,
  // passed in the URL, or preserved from a role chosen before an OAuth hop.
  const preserved =
    typeof window !== "undefined"
      ? (sessionStorage.getItem(PENDING_TYPE_KEY) as UserType | null)
      : null;
  const [userType, setUserType] = useState<UserType | null>(
    search.type ?? preserved ?? null,
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwIssues = password ? passwordIssues(password) : [];
  const canSubmit =
    !!userType && consented && pwIssues.length === 0 && !loading;

  const redirectFor = (t: UserType) =>
    TYPE_OPTIONS.find((o) => o.value === t)?.redirect ?? "/";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userType) {
      setError("Choose how you will use Eve & Eden before continuing.");
      return;
    }
    if (!consented) {
      setError("Please confirm you have read the terms, privacy notice and medical disclaimer.");
      return;
    }
    if (pwIssues.length > 0) {
      setError(pwIssues.join(" "));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { full_name: fullName, user_type: userType },
        },
      });
      if (error) throw error;
      const user = data.user;
      if (user) {
        const { error: pErr } = await supabase.from("profiles").upsert({
          id: user.id,
          user_type: userType,
          full_name: fullName,
          ...buildConsentRecord(),
        });
        if (pErr) throw pErr;
      }
      track("signup_completed", { user_type: userType });
      sessionStorage.removeItem(PENDING_TYPE_KEY);
      if (data.session) {
        navigate({ to: redirectFor(userType) });
      } else {
        setError("Check your email to confirm your account, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    if (!userType) {
      setError("Choose how you will use Eve & Eden before continuing with Google.");
      return;
    }
    if (!consented) {
      setError("Please confirm you have read the terms, privacy notice and medical disclaimer.");
      return;
    }
    // Preserve the explicitly selected role across the OAuth round trip.
    sessionStorage.setItem(PENDING_TYPE_KEY, userType);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/login`,
    });
    if (result.error) setError(result.error.message);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-eve-sand px-6 py-12">
      <div className="w-full max-w-md">
        <SectionLabel>Create account</SectionLabel>
        <h1 className="mt-2 font-serif text-4xl text-eve-teal">Welcome</h1>
        <p className="mt-2 font-sans text-sm text-eve-muted">
          Join Eve &amp; Eden Health.
        </p>

        <fieldset className="mt-6">
          <legend className="font-sans text-sm text-eve-muted">
            How will you use Eve &amp; Eden?{" "}
            <span className="text-eve-rose">Required</span>
          </legend>
          <div
            role="radiogroup"
            aria-label="Account type"
            className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={userType === opt.value}
                onClick={() => setUserType(opt.value)}
                className={cn(
                  "min-h-11 rounded-2xl border px-3 py-3 text-left font-sans text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal",
                  userType === opt.value
                    ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
                    : "border-eve-muted/30 bg-white text-eve-muted hover:border-eve-teal/50",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <form onSubmit={handleSignup} className="mt-6 space-y-3" noValidate>
          <label htmlFor="signup-name" className="sr-only">
            Full name
          </label>
          <Input
            id="signup-name"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-white"
          />
          <label htmlFor="signup-email" className="sr-only">
            Email
          </label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white"
          />
          <label htmlFor="signup-password" className="sr-only">
            Password
          </label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={PASSWORD_MIN_LENGTH}
            aria-describedby="signup-password-help"
            className="bg-white"
          />
          <p id="signup-password-help" className="font-sans text-xs text-eve-muted">
            {pwIssues.length > 0
              ? pwIssues.join(" ")
              : `Use at least ${PASSWORD_MIN_LENGTH} characters with a mix of letters and numbers or symbols. Avoid a password you use elsewhere.`}
          </p>

          <label className="flex items-start gap-3 rounded-2xl border border-eve-muted/30 bg-white p-3">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-1 size-5 accent-[color:var(--eve-teal,#0f766e)]"
              aria-describedby="signup-consent-help"
            />
            <span className="font-sans text-xs leading-relaxed text-eve-muted">
              I have read and agree to the{" "}
              <Link to="/terms" className="text-eve-teal underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-eve-teal underline">
                Privacy notice
              </Link>
              , and I understand the medical disclaimer below.
            </span>
          </label>
          <p id="signup-consent-help" className="font-sans text-xs text-eve-muted">
            Eve &amp; Eden gives general information and helps you find care. It
            does not provide medical diagnosis or treatment and is not a
            substitute for a qualified clinician. In an emergency, contact local
            emergency services.
          </p>

          {error && (
            <p role="alert" className="font-sans text-sm text-eve-rose">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" disabled={!canSubmit} className="w-full">
            {loading ? "Creating…" : "Create account"}
          </PrimaryButton>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-eve-muted/20" />
          <span className="font-sans text-xs text-eve-muted">or</span>
          <div className="h-px flex-1 bg-eve-muted/20" />
        </div>

        <SecondaryButton
          onClick={handleGoogle}
          disabled={!userType || !consented}
          className="w-full"
        >
          Continue with Google
        </SecondaryButton>

        <p className="mt-6 text-center font-sans text-sm text-eve-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-eve-teal underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
