import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/vendor/products")({
  component: EdenVendorProducts,
});

function EdenVendorProducts() {
  return (
    <EdenShell variant="vendor"><DesktopPlaceholder label="Catalogue" title="Products" /></EdenShell>
  );
}
