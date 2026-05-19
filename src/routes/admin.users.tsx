import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/shells/AdminShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  return (
    <AdminShell><DesktopPlaceholder label="Admin" title="Users" /></AdminShell>
  );
}
