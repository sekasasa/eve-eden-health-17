import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/analytics")({
  component: EdenAnalytics,
});

function EdenAnalytics() {
  return (
    <EdenShell><DesktopPlaceholder label="Analytics" title="Your performance" /></EdenShell>
  );
}
