import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eve/providers/$id")({
  component: EveProvidersId,
});

function EveProvidersId() {
  return (
    <EveShell><PlaceholderBody label="Provider" title="Provider profile" /></EveShell>
  );
}
