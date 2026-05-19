import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type UserType = "mother" | "provider" | "vendor" | "chw" | "admin";

interface Props {
  children: ReactNode;
  requiredType?: UserType | UserType[];
}

type State =
  | { status: "loading" }
  | { status: "ok" }
  | { status: "wrong-type"; actual: string | null };

export function ProtectedRoute({ children, requiredType }: Props) {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const check = async (userId: string | null) => {
      if (!userId) {
        navigate({ to: "/login" });
        return;
      }
      if (!requiredType) {
        if (!cancelled) setState({ status: "ok" });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", userId)
        .maybeSingle();
      const userType = data?.user_type ?? null;
      const allowed = Array.isArray(requiredType) ? requiredType : [requiredType];
      if (userType && allowed.includes(userType as UserType)) {
        if (!cancelled) setState({ status: "ok" });
      } else {
        if (!cancelled) setState({ status: "wrong-type", actual: userType });
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      check(data.session?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate, JSON.stringify(requiredType)]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-eve-sand">
        <p className="font-sans text-sm text-eve-muted">Loading…</p>
      </div>
    );
  }

  if (state.status === "wrong-type") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-eve-sand px-6 text-center">
        <p className="font-sans text-xs uppercase tracking-wide text-eve-muted">
          403
        </p>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">
          This area isn't for your account
        </h1>
        <p className="mt-3 max-w-sm font-sans text-sm text-eve-muted">
          You're signed in as {state.actual ?? "an unknown user type"}. Switch
          accounts to access this section.
        </p>
        <button
          className="mt-6 rounded-full bg-eve-teal px-6 py-3 font-sans text-sm font-medium text-white"
          onClick={() => navigate({ to: "/login" })}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
