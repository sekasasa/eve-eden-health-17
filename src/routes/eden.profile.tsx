import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/profile")({
  component: EdenProfile,
});

function EdenProfile() {
  return (
    <EdenShell><DesktopPlaceholder label="Profile" title="Public profile" /></EdenShell>
  );
}
