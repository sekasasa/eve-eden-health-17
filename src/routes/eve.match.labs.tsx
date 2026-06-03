import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Upload, AlertTriangle } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LAB_CATEGORIES, LAB_GUIDANCE } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match/labs")({
  component: LabSupport,
});

function LabSupport() {
  const nav = useNavigate();
  const [category, setCategory] = useState<string | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const guidance = category ? LAB_GUIDANCE[category] : null;

  return (
    <EveShell>
      <div className="px-3">
        <button
          onClick={() => nav({ to: "/eve/match/results" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <SectionLabel>Lab support</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          Understand my lab results
        </h1>
        <p className="mt-1 text-[12px] text-eve-muted">
          Upload a result or pick a category — we'll explain what it usually checks and
          what to ask your clinician.
        </p>
      </div>

      <section className="mx-3 mt-4 rounded-2xl border border-dashed border-eve-teal/40 bg-eve-teal-light/40 p-4 text-center">
        <Upload className="mx-auto h-5 w-5 text-eve-teal" />
        <p className="mt-2 text-sm font-medium text-eve-teal-dark">
          Upload PDF, photo, or screenshot
        </p>
        <label className="mt-2 inline-block cursor-pointer rounded-full bg-eve-teal px-4 py-2 text-xs font-medium text-white">
          Choose file
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f.name);
                eveToast.success("Lab result attached");
              }
            }}
          />
        </label>
        {file && <p className="mt-2 text-[11px] text-eve-teal">Attached: {file}</p>}
        <p className="mt-2 text-[10px] text-eve-muted">
          Or enter lab info manually below
        </p>
      </section>

      <section className="mt-5 px-3">
        <SectionLabel>Pick a category</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {LAB_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={cn(
                "rounded-xl border p-3 text-left text-xs",
                category === c.key
                  ? "border-eve-teal bg-eve-teal-light"
                  : "border-eve-muted/20 bg-white",
              )}
            >
              <p className="font-medium text-eve-teal-dark">{c.label}</p>
              <p className="text-[10px] text-eve-muted">{c.note}</p>
            </button>
          ))}
        </div>
      </section>

      {guidance && (
        <section className="mx-3 mt-5 rounded-2xl border border-eve-muted/20 bg-white p-4">
          <SectionLabel className="!text-eve-terra">Plain-language summary</SectionLabel>
          <p className="mt-2 text-sm font-semibold text-eve-teal-dark">
            What this test usually checks
          </p>
          <p className="text-[12px] text-eve-muted">{guidance.checks}</p>

          <p className="mt-3 text-sm font-semibold text-eve-teal-dark">
            Why it may matter for your life stage
          </p>
          <p className="text-[12px] text-eve-muted">{guidance.whyItMatters}</p>

          <p className="mt-3 text-sm font-semibold text-eve-teal-dark">
            Questions to ask your doctor
          </p>
          <ul className="mt-1 list-disc pl-5 text-[12px] text-eve-muted">
            {guidance.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-eve-rose-light p-2 text-[11px] text-eve-rose">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{guidance.urgent}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton
              onClick={() => eveToast.success("Saved for your next visit")}
              className="!py-1.5 !px-3 text-xs"
            >
              Save to my plan
            </PrimaryButton>
            <button
              onClick={() => nav({ to: "/eve/ask" })}
              className="rounded-full border border-eve-teal px-3 py-1.5 text-xs text-eve-teal"
            >
              Ask a Navigator
            </button>
          </div>
        </section>
      )}

      <p className="mt-5 px-3 pb-2 text-[10px] leading-relaxed text-eve-muted">
        Your result appears outside the reference range shown on your lab report. This
        may be something to discuss with your clinician, especially if you are pregnant,
        postpartum, or experiencing symptoms. Eve & Eden provides education and
        guidance, not diagnosis.
      </p>
    </EveShell>
  );
}
