import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, Camera } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { RX_LIFE_STAGES } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match/prescriptions")({
  component: RxSupport,
});

function RxSupport() {
  const nav = useNavigate();
  const [med, setMed] = useState("");
  const [dose, setDose] = useState("");
  const [stage, setStage] = useState<string | null>(null);
  const [reminder, setReminder] = useState(false);
  const submitted = med.trim().length > 1 && stage;

  return (
    <EveShell>
      <div className="px-3">
        <button
          onClick={() => nav({ to: "/eve/match/results" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <SectionLabel>Prescription support</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          Check my prescription
        </h1>
      </div>

      <section className="mt-4 px-3 flex flex-col gap-3">
        <div>
          <SectionLabel>Medication name</SectionLabel>
          <input
            value={med}
            onChange={(e) => setMed(e.target.value)}
            placeholder="e.g. Folic acid 5mg"
            className="mt-1 w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <SectionLabel>Dosage (optional)</SectionLabel>
          <input
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="e.g. 1 tablet daily"
            className="mt-1 w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-eve-teal/40 bg-eve-teal-light/40 px-3 py-3 text-center text-xs text-eve-teal-dark">
            <Camera className="mx-auto h-4 w-4 text-eve-teal" />
            <p className="mt-1">Scan bottle</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={() => eveToast.success("Image attached")}
            />
          </label>
          <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-eve-teal/40 bg-eve-teal-light/40 px-3 py-3 text-center text-xs text-eve-teal-dark">
            <Camera className="mx-auto h-4 w-4 text-eve-teal" />
            <p className="mt-1">Upload Rx</p>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={() => eveToast.success("Prescription attached")}
            />
          </label>
        </div>

        <div>
          <SectionLabel>Life stage</SectionLabel>
          <div className="mt-1 flex flex-wrap gap-2">
            {RX_LIFE_STAGES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStage(s.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs",
                  stage === s.key
                    ? "border-eve-teal bg-eve-teal text-white"
                    : "border-eve-muted/30 bg-white text-eve-teal-dark",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-eve-teal-dark">
          <input
            type="checkbox"
            checked={reminder}
            onChange={(e) => setReminder(e.target.checked)}
            className="h-4 w-4 accent-eve-teal"
          />
          Set refill reminder
        </label>
      </section>

      {submitted && (
        <section className="mx-3 mt-5 rounded-2xl border border-eve-muted/20 bg-white p-4">
          <SectionLabel className="!text-eve-terra">Plain-language summary</SectionLabel>
          <p className="mt-2 text-sm font-semibold text-eve-teal-dark">
            What this medication is commonly used for
          </p>
          <p className="text-[12px] text-eve-muted">
            {med} is often prescribed in maternal health. Your clinician will confirm
            why it was chosen for you.
          </p>

          <p className="mt-3 text-sm font-semibold text-eve-teal-dark">
            Questions to ask your doctor or pharmacist
          </p>
          <ul className="mt-1 list-disc pl-5 text-[12px] text-eve-muted">
            <li>Is this dose right for my stage?</li>
            <li>Should I take it with food?</li>
            <li>Are there interactions with my other medications?</li>
            <li>How long should I take it?</li>
          </ul>

          {(stage === "pregnant" ||
            stage === "breastfeeding" ||
            stage === "postpartum" ||
            stage === "ttc") && (
            <>
              <p className="mt-3 text-sm font-semibold text-eve-teal-dark">
                Pregnancy / breastfeeding considerations
              </p>
              <p className="text-[12px] text-eve-muted">
                Some medications need to be reviewed during pregnancy, postpartum, or
                breastfeeding. Confirm safety with your clinician before continuing.
              </p>
            </>
          )}

          <p className="mt-3 text-sm font-semibold text-eve-teal-dark">
            Common side effects to ask about
          </p>
          <p className="text-[12px] text-eve-muted">
            Nausea, headache, fatigue, or skin reactions — report severe or new
            symptoms.
          </p>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-eve-rose-light p-2 text-[11px] text-eve-rose">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Red flags: trouble breathing, swelling of face/throat, severe bleeding, or
              loss of consciousness — seek emergency care.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton
              onClick={() => eveToast.success("Saved to your plan")}
              className="!py-1.5 !px-3 text-xs"
            >
              Save
            </PrimaryButton>
            <SecondaryButton
              onClick={() => eveToast.info("Showing partner pharmacies")}
              className="!py-1.5 !px-3 text-xs"
            >
              Find pharmacy
            </SecondaryButton>
            <button
              onClick={() => eveToast.info("Looking up coverage")}
              className="rounded-full bg-eve-cream px-3 py-1.5 text-xs text-eve-teal-dark"
            >
              Lower-cost options
            </button>
          </div>
        </section>
      )}

      <p className="mt-5 px-3 pb-2 text-[10px] leading-relaxed text-eve-muted">
        Eve & Eden provides education only. Do not start, stop, or change medication
        without speaking with a licensed clinician.
      </p>
    </EveShell>
  );
}
