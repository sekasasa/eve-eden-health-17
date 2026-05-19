import { createFileRoute } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/chw/mothers/$id/visit")({
  component: ChwMothersIdVisit,
});

function ChwMothersIdVisit() {
  return (
    <CHWShell><PlaceholderBody label="Visit" title="Log a visit" /></CHWShell>
  );
}
