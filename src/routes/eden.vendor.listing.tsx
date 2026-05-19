import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eden/vendor/listing")({
  component: EdenVendorListing,
});

function EdenVendorListing() {
  return (
    <EdenShell variant="vendor"><DesktopPlaceholder label="Listing" title="Featured listing" /></EdenShell>
  );
}
