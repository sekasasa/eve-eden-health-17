import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/shells/AdminShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/admin/guidance")({
  component: AdminGuidance,
});

function AdminGuidance() {
  return (
    <AdminShell><DesktopPlaceholder label="Admin" title="Guidance content" /></AdminShell>
  );
}
