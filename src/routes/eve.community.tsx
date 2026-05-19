import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/eve/community")({
  component: EveCommunity,
});

function EveCommunity() {
  return (
    <EveShell><PlaceholderBody label="Community" title="Our circle" /></EveShell>
  );
}
