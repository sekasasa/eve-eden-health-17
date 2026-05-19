import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/program/mothers")({
  component: ProgramMothers,
});

function ProgramMothers() {
  return (
    <ProgramShell><DesktopPlaceholder label="Mothers" title="Mothers" /></ProgramShell>
  );
}
