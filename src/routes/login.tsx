import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Eve & Eden Health" }] }),
  component: LoginPage,
});

const REDIRECT_BY_TYPE: Record<string, string> = {
  mother: "/eve/home",
  provider: "/eden/dashboard",
  vendor: "/eden/vendor/dashboard",
  chw: "/chw/home",
  admin: "/admin/providers",
};

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeUser = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("user_type, language_chosen_at")
      .eq("id", userId)
      .maybeSingle();
    let userType = data?.user_type as string | undefined;
    if (!userType) {
      const pending = sessionStorage.getItem("eve_pending_user_type");
      userType = pending || "mother";
      await supabase.from("profiles").upsert({
        id: userId,
        user_type: userType,
      });
      sessionStorage.removeItem("eve_pending_user_type");
    }
    const dest = REDIRECT_BY_TYPE[userType] ?? "/eve/home";
    if (!data?.language_chosen_at) {
      navigate({ to: "/choose-language", search: { next: dest } });
      return;
    }
    navigate({ to: dest });
  };

  // Handle OAuth return: if a session already exists, route the user
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        routeUser(data.session.user.id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) await routeUser(data.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) setError(result.error.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-eve-sand px-6 py-12">
      <div className="w-full max-w-md">
        <SectionLabel>Welcome back</SectionLabel>
        <h1 className="mt-2 font-serif text-4xl text-eve-teal">Sign in</h1>
        <p className="mt-2 font-sans text-sm text-eve-muted">
          Continue your Eve & Eden Health journey.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-3">
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
            className="bg-white"
          />
          {error && (
            <p className="font-sans text-sm text-eve-rose">{error}</p>
          )}
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
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
          New to Eve & Eden?{" "}
          <Link to="/signup" className="text-eve-teal underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
