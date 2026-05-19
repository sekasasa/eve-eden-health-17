import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/program/alerts")({
  component: ProgramAlerts,
});

type Alert = {
  id: string;
  risk_type: string;
  note: string | null;
  created_at: string;
  resolved: boolean;
  mother_id: string;
  chw_id: string;
  mother_name?: string;
  village?: string;
  chw_name?: string;
};

function ProgramAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chw_alerts")
        .select("id,risk_type,note,created_at,resolved,mother_id,chw_id")
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as Alert[];
      const mIds = [...new Set(rows.map((r) => r.mother_id))];
      const cIds = [...new Set(rows.map((r) => r.chw_id))];
      const [mRes, pRes] = await Promise.all([
        mIds.length ? supabase.from("chw_mothers").select("id,mother_name,village").in("id", mIds) : Promise.resolve({ data: [] }),
        cIds.length ? supabase.from("profiles").select("id,full_name").in("id", cIds) : Promise.resolve({ data: [] }),
      ]);
      const mMap = new Map((mRes.data ?? []).map((r: { id: string; mother_name: string; village: string | null }) => [r.id, r]));
      const pMap = new Map((pRes.data ?? []).map((r: { id: string; full_name: string | null }) => [r.id, r.full_name]));
      rows.forEach((r) => {
        r.mother_name = mMap.get(r.mother_id)?.mother_name ?? "—";
        r.village = mMap.get(r.mother_id)?.village ?? "—";
        r.chw_name = pMap.get(r.chw_id) ?? "—";
      });
      setAlerts(rows);
    })();
  }, []);

  const list = alerts.filter((a) =>
    filter === "all" ? true : filter === "open" ? !a.resolved : a.resolved,
  );

  async function resolve(id: string) {
    await supabase.from("chw_alerts").update({ resolved: true }).eq("id", id);
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, resolved: true } : x)));
  }

  return (
    <ProgramShell>
      <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Risk alerts</h1>
      <p className="mt-1 font-sans text-sm text-gray-500">High-risk flags raised by field workers.</p>

      <div className="mt-5 flex gap-2">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 font-sans text-xs capitalize",
              filter === f ? "bg-eve-teal text-white" : "bg-white text-gray-600 border border-gray-200",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Mother</th>
              <th className="px-4 py-3">Village</th>
              <th className="px-4 py-3">CHW</th>
              <th className="px-4 py-3">Risk type</th>
              <th className="px-4 py-3">Flagged at</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Nothing here.</td></tr>
            )}
            {list.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{a.mother_name}</td>
                <td className="px-4 py-3 text-gray-600">{a.village}</td>
                <td className="px-4 py-3 text-gray-600">{a.chw_name}</td>
                <td className="px-4 py-3 text-gray-900">{a.risk_type}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(a.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 font-sans text-[10px]", a.resolved ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700")}>
                    {a.resolved ? "Resolved" : "Open"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {!a.resolved && (
                    <button onClick={() => resolve(a.id)} className="rounded-md border border-gray-200 px-3 py-1 font-sans text-xs hover:bg-gray-50">
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProgramShell>
  );
}
