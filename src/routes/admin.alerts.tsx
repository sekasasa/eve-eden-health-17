import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/shells/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/alerts")({
  component: AdminAlerts,
});

type Alert = {
  id: string;
  mother_id: string;
  chw_id: string;
  risk_type: string;
  note: string | null;
  resolved: boolean;
  created_at: string;
  mother?: { mother_name: string | null; district: string | null } | null;
};

function AdminAlerts() {
  const [rows, setRows] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chw_alerts")
      .select("*")
      .order("created_at", { ascending: false });
    const alerts = (data ?? []) as Alert[];
    const motherIds = Array.from(new Set(alerts.map((a) => a.mother_id)));
    if (motherIds.length) {
      const { data: mothers } = await supabase.from("chw_mothers").select("id,mother_name,district").in("id", motherIds);
      const map = new Map((mothers ?? []).map((m) => [m.id, m]));
      alerts.forEach((a) => { a.mother = map.get(a.mother_id) ?? null; });
    }
    setRows(alerts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (a: Alert) => {
    const { error } = await supabase.from("chw_alerts").update({ resolved: true }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Marked resolved");
    load();
  };

  const filtered = rows.filter((r) =>
    filter === "all" ? true : filter === "open" ? !r.resolved : r.resolved
  );

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-eve-teal-dark">Risk alerts</h1>
          <p className="mt-1 font-sans text-sm text-eve-muted">High-risk flags raised by CHW workers in the field.</p>
        </div>
        <div className="flex items-center gap-2">
          {(["open", "resolved", "all"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={
              "rounded-full px-3 py-1.5 font-sans text-xs capitalize " +
              (filter === s ? "bg-eve-teal text-white" : "bg-white text-eve-muted ring-1 ring-eve-muted/20")
            }>{s}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-eve-muted/15 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-eve-cream/50 text-eve-muted">
            <tr>
              <th className="px-4 py-3 text-left font-sans font-medium">Raised</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Mother</th>
              <th className="px-4 py-3 text-left font-sans font-medium">District</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Risk type</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Note</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-eve-muted">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-eve-muted">No alerts.</td></tr>}
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-eve-muted/10 hover:bg-eve-cream/30">
                <td className="px-4 py-3 font-sans text-xs text-eve-muted">{new Date(a.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 font-sans text-eve-forest">{a.mother?.mother_name ?? "—"}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{a.mother?.district ?? "—"}</td>
                <td className="px-4 py-3 font-sans font-medium text-red-700">{a.risk_type}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{a.note ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={"rounded-full px-2 py-0.5 font-sans text-xs " + (a.resolved ? "bg-eve-teal/15 text-eve-teal-dark" : "bg-amber-100 text-amber-800")}>
                    {a.resolved ? "Resolved" : "Open"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {!a.resolved && (
                    <Button size="sm" variant="outline" onClick={() => resolve(a)}>Mark resolved</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
