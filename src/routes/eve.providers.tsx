import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eve/providers")({
  component: EveProviders,
});

function EveProviders() {
  return (
    <EveShell><PlaceholderBody label="Providers" title="Find a provider" /></EveShell>
  );
}
