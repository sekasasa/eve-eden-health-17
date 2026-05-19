import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/vendor/orders")({
  component: EdenVendorOrders,
});

function EdenVendorOrders() {
  return (
    <EdenShell variant="vendor"><DesktopPlaceholder label="Orders" title="Recent orders" /></EdenShell>
  );
}
