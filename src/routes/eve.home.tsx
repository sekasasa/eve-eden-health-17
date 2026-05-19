import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { StageRing } from "@/components/ui/StageRing";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EveCard } from "@/components/ui/EveCard";
import { GuidanceCard } from "@/components/ui/GuidanceCard";
import { AICard } from "@/components/ui/AICard";
import { TrustBadge } from "@/components/ui/TrustBadge";

export const Route = createFileRoute("/eve/home")({
  component: EveHome,
});

function EveHome() {
  return (
    <EveShell>
      <SectionLabel>This week</SectionLabel>
      <h1 className="mt-1 font-serif text-2xl text-eve-teal-dark">
        Good morning, Amara
      </h1>
      <div className="mt-6 flex justify-center">
        <StageRing week={22} />
      </div>
      <div className="mt-6 space-y-3">
        <GuidanceCard>
          <SectionLabel>Guidance</SectionLabel>
          <p className="mt-1 font-sans text-sm text-eve-teal-dark">
            Iron-rich meals reviewed by Lagos nutritionists.
          </p>
        </GuidanceCard>
        <AICard>
          <p className="font-sans text-sm">
            Ask Eve anything about your week 22 symptoms.
          </p>
        </AICard>
        <EveCard>
          <p className="font-sans text-sm text-eve-teal-dark">
            Dr. Adaeze Okeke — Antenatal review on Thursday.
          </p>
          <div className="mt-2">
            <TrustBadge />
          </div>
        </EveCard>
      </div>
    </EveShell>
  );
}
