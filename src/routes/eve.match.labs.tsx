import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Upload,
  AlertTriangle,
  Pill,
  FlaskConical,
  Bell,
  ScanLine,
  Store,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LAB_CATEGORIES, LAB_GUIDANCE, type LifeStage } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { useSavedProfile } from "@/hooks/useSavedProfile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match/labs")({
  component: LabSupport,
});

// Suggest lab categories based on saved stage — no re-asking
const STAGE_LABS: Partial<Record<LifeStage, string[]>> = {
  ttc: ["fertility", "hormones", "thyroid", "vitamins"],
  ivf: ["fertility", "hormones", "thyroid"],
  pregnant: ["pregnancy", "iron", "glucose", "thyroid"],
  postpartum: ["postpartum", "iron", "thyroid", "vitamins"],
  pcos: ["hormones", "glucose", "thyroid"],
  wellness: ["general", "vitamins", "thyroid"],
  newborn: ["general"],
  mood: ["thyroid", "vitamins"],
};

type Action = "upload" | "manual" | "saved" | "add_med" | "upload_rx" | "scan_rx" | "refill" | "pharmacy";

function LabSupport() {
  const nav = useNavigate();
  const { profile } = useSavedProfile();
  const stage = profile.stage as LifeStage | undefined;
  const [action, setAction] = useState<Action | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const guidance = category ? LAB_GUIDANCE[category] : null;

  const suggested = useMemo(() => {
    const keys = (stage && STAGE_LABS[stage]) || [];
    const set = new Set(keys);
    return [
      ...LAB_CATEGORIES.filter((c) => set.has(c.key)),
      ...LAB_CATEGORIES.filter((c) => !set.has(c.key)),
    ];
  }, [stage]);

  const stageLabel: Record<string, string> = {
    ttc: "preconception",
    ivf: "IVF",
    pregnant: "pregnancy",
    postpartum: "postpartum",
    pcos: "hormonal health",
    wellness: "wellness",
    newborn: "newborn",
    mood: "mood support",
  };
  const contextHint = stage && stageLabel[stage]
    ? `Personalized for your ${stageLabel[stage]} journey.`
    : "Use the actions below to manage your labs and medications.";

  return (
    <EveShell>
      <div className="px-3">
        <button
          onClick={() => nav({ to: "/eve/home" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </button>
        <SectionLabel>Labs & prescriptions</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          What would you like to do?
        </h1>
        <p className="mt-1 text-[12px] text-eve-muted">{contextHint}</p>
      </div>

      {/* Contextual action grid — no survey re-ask */}
      <div className="mt-4 grid grid-cols-2 gap-2 px-3">
        <ActionTile
          icon={<Upload className="h-4 w-4 text-eve-teal" />}
          label="Upload lab result"
          active={action === "upload"}
          onClick={() => setAction("upload")}
        />
        <ActionTile
          icon={<FlaskConical className="h-4 w-4 text-eve-teal" />}
          label="Enter lab manually"
          active={action === "manual"}
          onClick={() => setAction("manual")}
        />
        <ActionTile
          icon={<Pill className="h-4 w-4 text-eve-terra" />}
          label="Add medication"
          active={action === "add_med"}
          onClick={() => {
            setAction("add_med");
            eveToast.info("Add medication form opening soon");
          }}
        />
        <ActionTile
          icon={<Upload className="h-4 w-4 text-eve-terra" />}
          label="Upload prescription"
          active={action === "upload_rx"}
          onClick={() => {
            setAction("upload_rx");
            eveToast.info("Upload prescription opening soon");
          }}
        />
        <ActionTile
          icon={<ScanLine className="h-4 w-4 text-eve-forest" />}
          label="Scan medication bottle"
          active={action === "scan_rx"}
          onClick={() => {
            setAction("scan_rx");
            eveToast.info("Camera will open on a device");
          }}
        />
        <ActionTile
          icon={<Bell className="h-4 w-4 text-eve-forest" />}
          label="Set refill reminder"
          active={action === "refill"}
          onClick={() => {
            setAction("refill");
            eveToast.success("We'll remind you when it's time to refill");
          }}
        />
        <ActionTile
          icon={<Store className="h-4 w-4 text-eve-rose" />}
          label="Find pharmacy"
          active={action === "pharmacy"}
          onClick={() => nav({ to: "/eve/providers" })}
        />
      </div>

      {(action === "upload" || action === "manual") && (
        <section className="mx-3 mt-4 rounded-2xl border border-dashed border-eve-teal/40 bg-eve-teal-light/40 p-4 text-center">
          <Upload className="mx-auto h-5 w-5 text-eve-teal" />
          <p className="mt-2 text-sm font-medium text-eve-teal-dark">
            {action === "upload" ? "Upload PDF, photo, or screenshot" : "Enter the lab values you have"}
          </p>
          <label className="mt-2 inline-block cursor-pointer rounded-full bg-eve-teal px-4 py-2 text-xs font-medium text-white">
            {action === "upload" ? "Choose file" : "Start entry"}
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
        </section>
      )}

      <section className="mt-5 px-3">
        <SectionLabel>
          {stage ? "Suggested for you" : "Pick a category"}
        </SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {suggested.map((c) => (
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
              onClick={() => eveToast.success("Saved to your care plan")}
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
        Eve & Eden provides education and guidance to help you prepare for care.
        This is not a diagnosis or medical treatment. Please speak with a licensed
        clinician before making medical decisions.
      </p>
      <div className="mt-4">
        <NavigatorHelp />
      </div>
    </EveShell>
  );
}

function ActionTile({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border bg-white p-3 text-left transition-transform active:scale-[0.98]",
        active ? "border-eve-teal" : "border-eve-muted/20",
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-eve-cream">
        {icon}
      </div>
      <p className="font-sans text-[11px] font-medium text-eve-teal-dark">
        {label}
      </p>
    </button>
  );
}
