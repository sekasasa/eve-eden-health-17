import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { DesktopPlaceholder } from "@/components/ui/Placeholder";

export const Route = createFileRoute("/program/reports")({
  component: ProgramReports,
});

function ProgramReports() {
  return (
    <ProgramShell><DesktopPlaceholder label="Reports" title="Reports" /></ProgramShell>
  );
}
