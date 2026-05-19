import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { enqueue } from "@/lib/offline-sync";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chw/flag")({
  component: ChwFlag,
});

const RISK_TYPES = ["Severe bleeding", "Eclampsia", "Fetal distress", "Other"] as const;

type Mother = { id: string; mother_name: string; village: string | null };

function ChwFlag() {
  const navigate = useNavigate();
  const [mothers, setMothers] = useState<Mother[]>([]);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Mother | null>(null);
  const [riskType, setRiskType] = useState<(typeof RISK_TYPES)[number]>("Severe bleeding");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("chw_mothers")
        .select("id,mother_name,village")
        .eq("chw_id", auth.user.id)
        .order("mother_name");
      setMothers(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return mothers.slice(0, 8);
    const needle = q.toLowerCase();
    return mothers.filter((m) => m.mother_name.toLowerCase().includes(needle)).slice(0, 8);
  }, [mothers, q]);

  async function flag() {
    if (!picked) return;
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      return;
    }
    const alert = {
      chw_id: auth.user.id,
      mother_id: picked.id,
      risk_type: riskType,
      note: note || null,
    };
    const notify = {
      user_id: auth.user.id,
      type: "chw_alert",
      title: `Risk flagged: ${picked.mother_name}`,
      body: `${riskType}${note ? ` — ${note}` : ""}`,
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueue({ table: "chw_alerts", payload: alert });
      enqueue({
        table: "chw_mothers",
        payload: { id: picked.id, risk_level: "high", chw_id: auth.user.id, mother_name: picked.mother_name },
      });
      setDone(true);
      setSaving(false);
      return;
    }

    await supabase.from("chw_alerts").insert(alert);
    await supabase.from("chw_mothers").update({ risk_level: "high" }).eq("id", picked.id);
    // best-effort notification insert (RLS may block; ignore)
    await supabase.from("notifications").insert(notify as never).then(() => undefined, () => undefined);
    setDone(true);
    setSaving(false);
  }

  if (done) {
    return (
      <CHWShell>
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-serif text-xl text-red-700">Risk flagged</p>
          <p className="mt-2 font-sans text-sm text-red-700/80">
            An alert has been sent. Please follow up with the mother as soon as possible.
          </p>
          <div className="mt-5 flex gap-2">
            <PrimaryButton className="flex-1" onClick={() => navigate({ to: "/chw/home" })}>
              Back to home
            </PrimaryButton>
          </div>
        </div>
      </CHWShell>
    );
  }

  return (
    <CHWShell>
      <h1 className="font-serif text-2xl text-eve-teal-dark">Flag a risk</h1>
      <p className="mt-1 font-sans text-xs text-eve-muted">
        Raise an alert so the team can act quickly.
      </p>

      <div className="mt-6">
        <label className="mb-1 block font-sans text-[10px] uppercase tracking-widest text-eve-muted">
          Mother
        </label>
        {picked ? (
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <div>
              <p className="font-sans text-sm text-gray-900">{picked.mother_name}</p>
              <p className="font-sans text-xs text-eve-muted">{picked.village ?? ""}</p>
            </div>
            <button
              onClick={() => setPicked(null)}
              className="font-sans text-xs text-eve-teal"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name"
              className="w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
            />
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setPicked(m)}
                    className="block w-full px-3 py-2 text-left font-sans text-sm hover:bg-gray-50"
                  >
                    {m.mother_name}{" "}
                    <span className="text-xs text-eve-muted">{m.village ?? ""}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 font-sans text-xs text-eve-muted">No matches</li>
              )}
            </ul>
          </>
        )}
      </div>

      <div className="mt-5">
        <label className="mb-2 block font-sans text-[10px] uppercase tracking-widest text-eve-muted">
          Risk type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {RISK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setRiskType(t)}
              className={cn(
                "rounded-md border px-3 py-2 font-sans text-xs",
                riskType === t
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 bg-white text-gray-700",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1 block font-sans text-[10px] uppercase tracking-widest text-eve-muted">
          Note
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="What did you observe?"
          className="w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
        />
      </div>

      <div className="mt-6">
        <button
          onClick={flag}
          disabled={!picked || saving}
          className="w-full rounded-full bg-red-600 py-3 font-sans font-medium text-white disabled:opacity-50"
        >
          {saving ? "Sending…" : "Flag and alert"}
        </button>
      </div>
    </CHWShell>
  );
}
