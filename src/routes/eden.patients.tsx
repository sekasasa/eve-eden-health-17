import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/patients")({
  component: EdenPatients,
});

function EdenPatients() {
  return (
    <EdenShell><DesktopPlaceholder label="Patients" title="Your patients" /></EdenShell>
  );
}
