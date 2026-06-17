import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Pill,
  ShieldCheck,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useSavedProfile } from "@/hooks/useSavedProfile";
import { cn } from "@/lib/utils";
import type { LifeStage } from "@/lib/match-data";

export const Route = createFileRoute("/eve/care-support")({
  component: CareSupport,
});

type Tab = "labs" | "rx" | "insurance";

const STAGE_HINT: Partial<Record<LifeStage, string>> = {
  ttc: "Fertility labs, preconception meds, and payment options for trying to conceive.",
  ivf: "IVF labs, fertility medications, and insurance or self-pay for treatment.",
  pregnant: "Pregnancy labs, safe medications, and prenatal coverage options.",
  postpartum: "Postpartum labs, safe meds while breastfeeding, and coverage for recovery.",
  newborn: "Newborn screenings, pediatric medications, and family insurance plans.",
  pcos: "Hormonal labs, PCOS medications, and coverage for ongoing care.",
  mood: "Mental-health labs, mood medications, and therapy coverage.",
  wellness: "Annual screenings, supplements, and preventive coverage.",
  labs: "Understand your lab results and what to ask next.",
  rx: "Review your medications and find pharmacy or cost help.",
  insurance: "Compare local, international, and self-pay options.",
};

function CareSupport() {
  const nav = useNavigate();
  const { profile } = useSavedProfile();
  const stage = profile.stage as LifeStage | undefined;
  const [tab, setTab] = useState<Tab>("labs");

  const hint =
    (stage && STAGE_HINT[stage]) ??
    "Everything you need to understand your labs, manage prescriptions, and pay for care — in one place.";

  return (
    <EveShell>
      <div className="px-3">
        <button
          onClick={() => nav({ to: "/eve/home" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </button>
        <SectionLabel>Care support</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          Labs, prescriptions & payment
        </h1>
        <p className="mt-1 text-[12px] text-eve-muted">{hint}</p>
      </div>

      {/* Tab switcher */}
      <div className="mx-3 mt-4 grid grid-cols-3 gap-1 rounded-full bg-eve-cream p-1">
        <TabButton active={tab === "labs"} onClick={() => setTab("labs")} icon={<FlaskConical className="h-3.5 w-3.5" />} label="Labs" />
        <TabButton active={tab === "rx"} onClick={() => setTab("rx")} icon={<Pill className="h-3.5 w-3.5" />} label="Medications" />
        <TabButton active={tab === "insurance"} onClick={() => setTab("insurance")} icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Payment" />
      </div>

      {tab === "labs" && (
        <Panel
          title="Understand your labs"
          body="Upload a lab result or pick a category and we'll give you a plain-language summary, life-stage context, and questions to ask your clinician."
          actions={[
            { label: "Upload or enter a result", to: "/eve/match/labs" },
            { label: "Find a lab provider", to: "/eve/providers" },
          ]}
        />
      )}

      {tab === "rx" && (
        <Panel
          title="Manage your medications"
          body="Add a medication or scan a prescription. We'll explain what it's commonly used for, side effects to ask about, and pregnancy/breastfeeding safety considerations."
          actions={[
            { label: "Check a prescription", to: "/eve/match/prescriptions" },
            { label: "Find a pharmacy", to: "/eve/providers" },
          ]}
        />
      )}

      {tab === "insurance" && (
        <Panel
          title="Pay for your care"
          body="Compare local insurance, international plans, public coverage, and self-pay packages — matched to your life stage and budget."
          actions={[
            { label: "Compare payment options", to: "/eve/match/insurance" },
            { label: "Talk to a navigator", to: "/eve/ask" },
          ]}
        />
      )}

      <div className="mt-5">
        <NavigatorHelp />
      </div>

      <p className="mt-5 px-3 pb-2 text-[10px] leading-relaxed text-eve-muted">
        Eve & Eden provides education and care navigation — not diagnosis. Please confirm
        medical decisions with a licensed clinician.
      </p>
    </EveShell>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium transition-colors",
        active ? "bg-white text-eve-teal-dark shadow-sm" : "text-eve-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Panel({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: { label: string; to: string }[];
}) {
  return (
    <section className="mx-3 mt-4 rounded-2xl border border-eve-teal/20 bg-white p-4">
      <p className="font-serif text-eve-forest" style={{ fontSize: "17px" }}>
        {title}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-eve-muted">{body}</p>
      <div className="mt-3 flex flex-col gap-2">
        {actions.map((a, i) => (
          <Link
            key={a.to}
            to={a.to}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors",
              i === 0
                ? "bg-eve-teal text-white hover:bg-eve-teal-dark"
                : "border border-eve-teal/30 text-eve-teal-dark hover:bg-eve-teal-light/40",
            )}
          >
            <span className="text-sm font-medium">{a.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}


