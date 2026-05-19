import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/ui/BottomNav";
import { AICard } from "@/components/ui/AICard";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const Route = createFileRoute("/eve/ask")({
  component: () => (
    <div className="min-h-screen bg-eve-sand pb-28">
      <div className="mx-auto max-w-sm px-5 pt-10">
        <SectionLabel>Ask Eve</SectionLabel>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">
          What's on your mind?
        </h1>
        <AICard className="mt-6">
          <p className="font-sans text-sm">
            I'm here for questions about symptoms, nutrition and care.
          </p>
        </AICard>
      </div>
      <BottomNav />
    </div>
  ),
});
