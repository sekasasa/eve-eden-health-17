import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eve/guidance")({
  component: EveGuidance,
});

function EveGuidance() {
  return (
    <EveShell><PlaceholderBody label="Guidance" title="Stage-based content" /></EveShell>
  );
}
