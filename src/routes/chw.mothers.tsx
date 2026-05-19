import { createFileRoute } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/chw/mothers")({
  component: ChwMothers,
});

function ChwMothers() {
  return (
    <CHWShell><PlaceholderBody label="Roster" title="My mothers" /></CHWShell>
  );
}
