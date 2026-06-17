import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Sign up — Eve & Eden Health" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    type: s.type === "provider" || s.type === "vendor" ? s.type : "mother",
  }),
  component: SignupPage,
});

type UserType = "mother" | "provider" | "vendor";

const TYPE_OPTIONS: { value: UserType; label: string; redirect: string }[] = [
  { value: "mother", label: "I am expecting", redirect: "/eve/onboarding" },
  { value: "provider", label: "I am a provider", redirect: "/eden/onboarding" },
  { value: "vendor", label: "I am a vendor", redirect: "/eden/vendor/onboarding" },
];

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const initialType: UserType =
    (search.type as UserType) ||
    ((typeof window !== "undefined" &&
      (sessionStorage.getItem("eve_pending_user_type") as UserType)) ||
      "mother");
  const [userType, setUserType] = useState<UserType>(initialType);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectFor = (t: UserType) =>
    TYPE_OPTIONS.find((o) => o.value === t)?.redirect ?? "/";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        });
        if (pErr) throw pErr;
      }
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
    sessionStorage.setItem("eve_pending_user_type", userType);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) setError(result.error.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-eve-sand px-6 py-12">
      <div className="w-full max-w-md">
        <SectionLabel>Create account</SectionLabel>
        <h1 className="mt-2 font-serif text-4xl text-eve-teal">Welcome</h1>
        <p className="mt-2 font-sans text-sm text-eve-muted">
          Join Eve & Eden Health.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setUserType(opt.value)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left font-sans text-sm transition-all",
                userType === opt.value
                  ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
                  : "border-eve-muted/30 bg-white text-eve-muted hover:border-eve-teal/50",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSignup} className="mt-6 space-y-3">
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-white"
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-white"
          />
          {error && (
            <p className="font-sans text-sm text-eve-rose">{error}</p>
          )}
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Create account"}
          </PrimaryButton>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-eve-muted/20" />
          <span className="font-sans text-xs text-eve-muted">or</span>
          <div className="h-px flex-1 bg-eve-muted/20" />
        </div>

        <SecondaryButton onClick={handleGoogle} className="w-full">
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
