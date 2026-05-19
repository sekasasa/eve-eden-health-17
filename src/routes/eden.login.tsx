import { createFileRoute } from "@tanstack/react-router";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const Route = createFileRoute("/eden/login")({
  component: EdenLogin,
});

function EdenLogin() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md">
        <SectionLabel>Eden for Providers</SectionLabel>
        <h1 className="mt-2 font-serif text-3xl text-eve-forest">
          Provider sign in
        </h1>
        <p className="mt-3 font-sans text-sm text-eve-muted">
          Authentication coming soon.
        </p>
        <PrimaryButton className="mt-6 w-full">Continue</PrimaryButton>
      </div>
    </main>
  );
}
