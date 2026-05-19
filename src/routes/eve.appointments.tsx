import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eve/appointments")({
  component: EveAppointments,
});

function EveAppointments() {
  return (
    <EveShell><PlaceholderBody label="My care" title="Appointments" /></EveShell>
  );
}
