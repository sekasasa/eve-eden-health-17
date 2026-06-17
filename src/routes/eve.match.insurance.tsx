import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { INSURANCE_VENDORS, type LifeStage, type PaymentKey } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { useSavedProfile } from "@/hooks/useSavedProfile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match/insurance")({
  component: InsurancePage,
});

type Path =
  | "local"
  | "international"
  | "compare"
  | "qualify"
  | "self_pay"
  | "family"
  | "unsure";

const PATH_LABELS: Record<Path, string> = {
  local: "Use local insurance",
  international: "Use international insurance",
  compare: "Compare insurance vendors",
  qualify: "See if I qualify",
  self_pay: "Self-pay",
  family: "Family member helping pay",
  unsure: "I'm not sure",
};

const PAYMENT_TO_PATH: Partial<Record<PaymentKey, Path>> = {
  local_insurance: "local",
  international: "international",
  compare: "compare",
  qualify: "qualify",
  self_pay: "self_pay",
  family: "family",
  unsure: "unsure",
};

// Stage-aware recommendation copy
const STAGE_COPY: Partial<Record<LifeStage, string>> = {
  ivf: "Look for IVF coverage, self-pay fertility packages, and international reimbursement.",
  ttc: "Consider preconception coverage, fertility labs, and self-pay options.",
  pregnant: "Compare prenatal coverage, maternity packages, lab and prescription coverage.",
  postpartum: "Postpartum visits, lactation support, and mental health coverage matter most.",
  newborn: "Look for pediatric coverage, immunizations, and family plans.",
  pcos: "Check coverage for hormonal labs, ongoing medication, and specialist visits.",
  mood: "Mental health visits, therapy, and medication coverage matter most.",
  wellness: "Preventive screenings, annual visits, and general labs.",
};

function InsurancePage() {
  const nav = useNavigate();
  const { profile } = useSavedProfile();
  const stage = profile.stage as LifeStage | undefined;
  const savedPath =
    (profile.payment && PAYMENT_TO_PATH[profile.payment]) || "compare";
  const [path, setPath] = useState<Path>(savedPath);
  const [intlNeed, setIntlNeed] = useState<string | null>(null);

  const filter: "all" | "local" | "international" | "public" = useMemo(() => {
    if (path === "local") return "local";
    if (path === "international") return "international";
    if (path === "qualify") return "public";
    return "all";
  }, [path]);

  const list = useMemo(
    () =>
      INSURANCE_VENDORS.filter((v) =>
        filter === "all"
          ? true
          : filter === "local"
            ? v.coverageType === "Local"
            : filter === "international"
              ? v.coverageType === "International"
              : v.coverageType === "Public",
      ),
    [filter],
  );

  const recommendation =
    (stage && STAGE_COPY[stage]) ||
    "Compare options across coverage, network, and out-of-pocket costs.";

  return (
    <EveShell>
      <div className="px-3">
        <button
          onClick={() => nav({ to: "/eve/home" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </button>
        <SectionLabel>Insurance & payment</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          What payment option do you want to explore?
        </h1>
        <p className="mt-1 text-[12px] text-eve-muted">{recommendation}</p>
      </div>

      {/* Contextual path picker — only this small question, no full survey */}
      <div className="mx-3 mt-3 grid grid-cols-2 gap-2">
        {(Object.keys(PATH_LABELS) as Path[]).map((p) => (
          <button
            key={p}
            onClick={() => setPath(p)}
            className={cn(
              "rounded-xl border bg-white p-3 text-left text-[12px]",
              path === p
                ? "border-eve-teal bg-eve-teal-light"
                : "border-eve-muted/20",
            )}
          >
            <p className="font-medium text-eve-teal-dark">{PATH_LABELS[p]}</p>
            {profile.payment && PAYMENT_TO_PATH[profile.payment] === p && (
              <p className="mt-0.5 text-[10px] text-eve-teal">From your profile</p>
            )}
          </button>
        ))}
      </div>

      {/* Contextual follow-up for international */}
      {path === "international" && (
        <div className="mx-3 mt-3 rounded-2xl border border-eve-muted/20 bg-white p-3">
          <SectionLabel>What do you need help with?</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Direct billing",
              "Reimbursement documents",
              "Provider match",
              "Claim support",
              "Not sure",
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => setIntlNeed(opt)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px]",
                  intlNeed === opt
                    ? "border-eve-teal bg-eve-teal text-white"
                    : "border-eve-muted/30 bg-white text-eve-teal-dark",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Self-pay summary */}
      {path === "self_pay" && (
        <div className="mx-3 mt-3 rounded-2xl border border-eve-muted/20 bg-white p-3 text-[12px] text-eve-teal-dark">
          <SectionLabel>Self-pay highlights</SectionLabel>
          <ul className="mt-2 list-disc pl-5 text-[12px] text-eve-muted">
            <li>Faster booking, more provider choice</li>
            <li>No claim paperwork</li>
            <li>Packages and payment plans available with some providers</li>
          </ul>
        </div>
      )}

      {/* Vendor cards */}
      <div className="mt-3 flex flex-col gap-3 px-3">
        {list.map((v) => (
          <article
            key={v.id}
            className="rounded-2xl border border-eve-muted/20 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-sans text-sm font-semibold text-eve-teal-dark">
                  {v.name}
                </p>
                <p className="text-[11px] text-eve-muted">
                  {v.coverageType} · {v.regions.join(", ")}
                </p>
              </div>
              <span className="rounded-full bg-eve-teal-light px-2 py-0.5 text-[10px] font-medium text-eve-teal">
                {v.tier}
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-eve-terra">{v.monthly}</p>

            <p className="mt-2 text-[10px] uppercase tracking-widest text-eve-muted">
              Best for
            </p>
            <p className="text-[12px] text-eve-teal-dark">{v.bestFor.join(" · ")}</p>

            <ul className="mt-2 space-y-1">
              {v.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-[12px] text-eve-teal-dark">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-eve-teal" />
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <p>
                <span className="text-eve-muted">Waiting:</span>{" "}
                <span className="text-eve-teal-dark">{v.waiting}</span>
              </p>
              <p>
                <span className="text-eve-muted">Network:</span>{" "}
                <span className="text-eve-teal-dark">{v.network}</span>
              </p>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {v.perks.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-eve-cream px-2 py-0.5 text-[10px] text-eve-teal-dark"
                >
                  {p}
                </span>
              ))}
              {v.international && (
                <span className="rounded-full bg-eve-terra-light px-2 py-0.5 text-[10px] text-eve-terra">
                  International reimbursement
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <PrimaryButton
                onClick={() => eveToast.success(`Quote request sent to ${v.name}`)}
                className="!py-1.5 !px-3 text-xs"
              >
                Request Quote
              </PrimaryButton>
              <SecondaryButton
                onClick={() => eveToast.info("Plan saved")}
                className="!py-1.5 !px-3 text-xs"
              >
                Save
              </SecondaryButton>
              <button
                onClick={() => eveToast.info("A navigator will reach out")}
                className="rounded-full bg-eve-cream px-3 py-1.5 text-xs text-eve-teal-dark"
              >
                Ask Navigator
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 px-3 pb-2 text-[10px] leading-relaxed text-eve-muted">
        Estimated prices are guidance only. Final premiums depend on age, location,
        and coverage selected.
      </p>
      <div className="mt-4">
        <NavigatorHelp />
      </div>
    </EveShell>
  );
}
