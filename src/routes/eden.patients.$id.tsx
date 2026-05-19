import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/patients/$id")({
  component: EdenPatientsId,
});

function EdenPatientsId() {
  return (
    <EdenShell><DesktopPlaceholder label="Patient" title="Patient record" /></EdenShell>
  );
}
