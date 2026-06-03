import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { INSURANCE_VENDORS } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match/insurance")({
  component: InsurancePage,
});

type Filter = "all" | "local" | "international" | "public";

function InsurancePage() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
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

  return (
    <EveShell>
      <div className="px-3">
        <button
          onClick={() => nav({ to: "/eve/match/results" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <SectionLabel>Insurance & payment</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          Compare insurance vendors
        </h1>
        <p className="mt-1 text-[12px] text-eve-muted">
          Side-by-side options for maternity, postpartum, labs, prescriptions, and more.
        </p>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {(
          [
            { k: "all", l: "All" },
            { k: "local", l: "Local" },
            { k: "international", l: "International" },
            { k: "public", l: "Public" },
          ] as { k: Filter; l: string }[]
        ).map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs",
              filter === f.k
                ? "border-eve-teal bg-eve-teal text-white"
                : "border-eve-muted/30 bg-white text-eve-teal-dark",
            )}
          >
            {f.l}
          </button>
        ))}
      </div>

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
                Talk to Navigator
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 px-3 pb-2 text-[10px] leading-relaxed text-eve-muted">
        Estimated prices are guidance only. Final premiums depend on age, location, and
        coverage selected.
      </p>
    </EveShell>
  );
}
