import { createFileRoute } from "@tanstack/react-router";
import { EveShell } from "@/components/shells/EveShell";
import { StageRing } from "@/components/ui/StageRing";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const Route = createFileRoute("/eve/profile")({
  component: EveProfile,
});

function EveProfile() {
  return (
    <EveShell>
      <div className="pt-2 text-center">
        <SectionLabel>Profile</SectionLabel>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">Amara</h1>
        <div className="mt-6 flex justify-center">
          <StageRing week={22} />
        </div>
      </div>
    </EveShell>
  );
}
