import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/onboarding")({
  component: EdenOnboarding,
});

function EdenOnboarding() {
  return (
    <EdenShell><DesktopPlaceholder label="Welcome" title="Set up your provider profile" /></EdenShell>
  );
}
