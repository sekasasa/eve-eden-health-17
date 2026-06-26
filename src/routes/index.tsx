import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { enterDemo } from "@/lib/demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eve & Eden Health — Maternal care navigation" },
      {
        name: "description",
        content:
          "Personalized maternal care navigation for every stage, culture, and country. Find support for fertility, pregnancy, postpartum, providers, community, events, and care preferences.",
      },
      { property: "og:title", content: "Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Personalized maternal care navigation for every stage, culture, and country.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"mother" | "provider" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDemo(role: "mother" | "provider") {
    setError(null);
    setLoading(role);
    try {
      await enterDemo(role);
      navigate({ to: role === "mother" ? "/eve/home" : "/eden/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load demo");
      setLoading(null);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-eve-sand px-6 text-center">
      <h1 className="font-serif text-5xl text-eve-teal sm:text-6xl">
        eve &amp; eden health
      </h1>
      <p className="mt-6 max-w-md font-sans text-base text-eve-muted sm:text-lg">
        Maternal care navigation for every stage, culture, and country.
      </p>
      <p className="mt-4 max-w-lg font-sans text-sm text-eve-muted/80 sm:text-base">
        Find support for fertility, pregnancy, postpartum, providers, community, events, and care preferences — in the language and context that feels right for you.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/signup" search={{ type: "mother" }}>
          <PrimaryButton>Get started</PrimaryButton>
        </Link>
        <Link to="/eden/login">
          <SecondaryButton>I am a provider</SecondaryButton>
        </Link>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="font-sans text-xs uppercase tracking-widest text-eve-muted">
          Explore without signing up
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-sans text-sm">
          <button
            onClick={() => handleDemo("mother")}
            disabled={loading !== null}
            className="text-eve-teal underline underline-offset-4 hover:text-eve-teal-dark disabled:opacity-60"
          >
            {loading === "mother" ? "Loading demo…" : "View demo"}
          </button>
          <span className="text-eve-muted/50">·</span>
          <button
            onClick={() => handleDemo("provider")}
            disabled={loading !== null}
            className="text-eve-teal underline underline-offset-4 hover:text-eve-teal-dark disabled:opacity-60"
          >
            {loading === "provider" ? "Loading demo…" : "View provider demo"}
          </button>
        </div>
        {error && (
          <p className="mt-2 font-sans text-xs text-eve-rose">{error}</p>
        )}
      </div>
    </main>
  );
}
