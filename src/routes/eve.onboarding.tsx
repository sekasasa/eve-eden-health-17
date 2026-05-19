import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const Route = createFileRoute("/eve/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  return (
    <EveShell hideNav unprotected>
      <div className="pt-6">
        <SectionLabel>Welcome</SectionLabel>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">
          Let's set up your journey
        </h1>
        <p className="mt-3 font-sans text-sm text-eve-muted">
          Onboarding coming soon.
        </p>
      </div>
    </EveShell>
  );
}
