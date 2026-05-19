import { createFileRoute } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/chw/flag")({
  component: ChwFlag,
});

function ChwFlag() {
  return (
    <CHWShell><PlaceholderBody label="Escalate" title="Flag for referral" /></CHWShell>
  );
}
