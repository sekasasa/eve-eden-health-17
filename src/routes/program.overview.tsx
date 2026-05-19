import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/program/overview")({
  component: ProgramOverview,
});

function ProgramOverview() {
  return (
    <ProgramShell><DesktopPlaceholder label="Overview" title="Program overview" /></ProgramShell>
  );
}
