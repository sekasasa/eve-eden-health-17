import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/shells/AdminShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/admin/vendors")({
  component: AdminVendors,
});

function AdminVendors() {
  return (
    <AdminShell><DesktopPlaceholder label="Admin" title="Vendors" /></AdminShell>
  );
}
