import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { EveSkeleton } from "@/components/ui/EveSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { supabase } from "@/integrations/supabase/client";
import { startNewIntake } from "@/lib/match-store";
import { eveToast } from "@/lib/eve-toast";

export const Route = createFileRoute("/eve/match/history")({
  component: HistoryPage,
});

type Row = {
  id: string;
  stage: string | null;
  need: string | null;
  city: string | null;
  language: string | null;
  payment: string | null;
  urgency: string | null;
  created_at: string;
};

function HistoryPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setRows([]);
      return;
    }
    const { data, error } = await supabase
      .from("match_intakes")
      .select("id, stage, need, city, language, payment, urgency, created_at")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    const { error } = await supabase.from("match_intakes").delete().eq("id", id);
    if (error) {
      eveToast.error("Couldn't delete", error.message);
      return;
    }
    eveToast.success("Removed");
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  }

  return (
    <EveShell>
      <div className="px-3">
        <button
          onClick={() => nav({ to: "/eve/match/results" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back to matches
        </button>
        <SectionLabel>Match history</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          Your saved intakes
        </h1>
        <p className="mt-1 text-[12px] text-eve-muted">
          Resume any past match or start a fresh one.
        </p>
      </div>

      <div className="mt-4 px-3">
        <PrimaryButton
          onClick={() => {
            startNewIntake();
            nav({ to: "/eve/match" });
          }}
          className="w-full inline-flex items-center justify-center gap-2 !py-2 text-sm"
        >
          <Sparkles className="h-4 w-4" />
          Start a new match
        </PrimaryButton>
      </div>

      <div className="mt-4 px-3">
        {error && <ErrorCard message={error} onRetry={load} />}

        {!rows && !error && (
          <div className="space-y-2">
            <EveSkeleton className="h-20" />
            <EveSkeleton className="h-20" />
            <EveSkeleton className="h-20" />
          </div>
        )}

        {rows && rows.length === 0 && !error && (
          <EmptyState
            title="No saved intakes yet"
            description="Complete an intake and it'll show up here so you can resume later."
            action={
              <Link
                to="/eve/match"
                className="rounded-full bg-eve-teal px-4 py-2 text-xs text-white"
              >
                Start your first match
              </Link>
            }
          />
        )}

        {rows && rows.length > 0 && (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-eve-muted/20 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-eve-muted">
                      {new Date(r.created_at).toLocaleString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 truncate font-sans text-sm font-medium text-eve-teal-dark">
                      {labelStage(r.stage)} · {labelNeed(r.need)}
                    </p>
                    <p className="text-[11px] text-eve-muted">
                      {[r.city, r.language, labelPayment(r.payment), labelUrgency(r.urgency)]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    aria-label="Delete"
                    className="text-eve-rose hover:text-eve-rose-light"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </EveShell>
  );
}

function labelStage(k: string | null) {
  if (!k) return "—";
  return (
    {
      ttc: "Trying to conceive",
      pregnant: "Pregnant",
      postpartum: "Postpartum",
      newborn: "Newborn / child",
      pcos: "PCOS / hormones",
      mood: "Mood support",
      labs: "Lab results",
      rx: "Prescription",
      insurance: "Insurance / payment",
      family: "Helping family",
    }[k] ?? k
  );
}
function labelNeed(k: string | null) {
  if (!k) return "—";
  return (
    {
      doctor: "Find a doctor",
      lab: "Find a lab",
      pharmacy: "Pharmacy support",
      labs_explain: "Understand labs",
      rx_explain: "Understand Rx",
      postpartum_support: "Postpartum support",
      wellness: "Wellness support",
      insurance_understand: "Insurance options",
      insurance_compare: "Compare insurance",
      international: "International insurance",
      self_pay: "Self-pay",
      navigator: "Talk to navigator",
    }[k] ?? k
  );
}
function labelPayment(k: string | null) {
  if (!k) return "";
  return (
    {
      local_insurance: "Local insurance",
      international: "International",
      qualify: "Eligibility check",
      compare: "Comparing plans",
      self_pay: "Self-pay",
      family: "Family will pay",
      unsure: "Unsure",
    }[k] ?? k
  );
}
function labelUrgency(k: string | null) {
  if (!k) return "";
  return (
    { today: "Today", this_week: "This week", planning: "Planning", exploring: "Exploring" }[k] ??
    k
  );
}
