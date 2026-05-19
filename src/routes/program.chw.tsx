import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/program/chw")({
  component: ProgramChw,
});

function ProgramChw() {
  return (
    <ProgramShell><DesktopPlaceholder label="CHW" title="Community health workers" /></ProgramShell>
  );
}
