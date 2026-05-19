import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/appointments")({
  component: EdenAppointments,
});

function EdenAppointments() {
  return (
    <EdenShell><DesktopPlaceholder label="Schedule" title="Appointments" /></EdenShell>
  );
}
