import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { AICard } from "@/components/ui/AICard";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const Route = createFileRoute("/eve/ask")({
  component: AskEve,
});

function AskEve() {
  return (
    <EveShell>
      <SectionLabel>Ask Eve</SectionLabel>
      <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">
        What's on your mind?
      </h1>
      <AICard className="mt-6">
        <p className="font-sans text-sm">
          I'm here for questions about symptoms, nutrition and care.
        </p>
      </AICard>
    </EveShell>
  );
}
