import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eve/vendors/$id")({
  component: EveVendorsId,
});

function EveVendorsId() {
  return (
    <EveShell><PlaceholderBody label="Vendor" title="Vendor & products" /></EveShell>
  );
}
