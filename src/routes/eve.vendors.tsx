import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eve/vendors")({
  component: EveVendors,
});

function EveVendors() {
  return (
    <EveShell><PlaceholderBody label="Marketplace" title="Vendors" /></EveShell>
  );
}
