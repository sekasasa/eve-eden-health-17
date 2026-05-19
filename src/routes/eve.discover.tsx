import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const Route = createFileRoute("/eve/discover")({
  component: () => (
    <div className="min-h-screen bg-eve-sand pb-28">
      <div className="mx-auto max-w-sm px-5 pt-10">
        <SectionLabel>Discover</SectionLabel>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">
          Trusted providers near you
        </h1>
      </div>
      <BottomNav />
    </div>
  ),
});
