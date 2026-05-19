import { createFileRoute } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { PlaceholderBody } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/chw/register")({
  component: ChwRegister,
});

function ChwRegister() {
  return (
    <CHWShell><PlaceholderBody label="Register" title="Register a mother" /></CHWShell>
  );
}
