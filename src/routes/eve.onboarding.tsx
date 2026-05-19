import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const Route = createFileRoute("/eve/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  return (
    <div className="min-h-screen bg-eve-sand pb-28">
      <div className="mx-auto max-w-sm px-5 pt-10">
        <SectionLabel>Welcome</SectionLabel>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">
          Let's set up your journey
        </h1>
        <p className="mt-3 font-sans text-sm text-eve-muted">
          Onboarding coming soon.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
