import { createFileRoute } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/chw/home")({
  component: ChwHome,
});

function ChwHome() {
  return (
    <CHWShell><PlaceholderBody label="Field home" title="Today's work" /></CHWShell>
  );
}
