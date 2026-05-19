import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/program/chw")({
  component: ProgramChw,
});

type Worker = {
  id: string;
  name: string;
  phone: string | null;
  district: string;
  mothers: number;
  visitsMonth: number;
  lastActive: string | null;
};

function ProgramChw() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", country: "MA" });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,full_name,phone,country")
      .eq("user_type", "chw");
    const chwIds = (profs ?? []).map((p) => p.id);
    if (!chwIds.length) {
      setWorkers([]);
      return;
    }
    const monthStart = new Date();
    monthStart.setDate(1);
    const since = monthStart.toISOString().slice(0, 10);
    const [mothersRes, visitsRes, lastRes] = await Promise.all([
      supabase.from("chw_mothers").select("chw_id,district").in("chw_id", chwIds),
      supabase.from("visits").select("chw_id").in("chw_id", chwIds).gte("visit_date", since),
      supabase.from("visits").select("chw_id,created_at").in("chw_id", chwIds).order("created_at", { ascending: false }),
    ]);
    const mothersCount = new Map<string, number>();
    const districts = new Map<string, string>();
    (mothersRes.data ?? []).forEach((r) => {
      mothersCount.set(r.chw_id, (mothersCount.get(r.chw_id) ?? 0) + 1);
      if (r.district && !districts.has(r.chw_id)) districts.set(r.chw_id, r.district);
    });
    const visitsCount = new Map<string, number>();
    (visitsRes.data ?? []).forEach((r) => visitsCount.set(r.chw_id, (visitsCount.get(r.chw_id) ?? 0) + 1));
    const lastActive = new Map<string, string>();
    (lastRes.data ?? []).forEach((r) => {
      if (!lastActive.has(r.chw_id)) lastActive.set(r.chw_id, r.created_at);
    });
    setWorkers(
      (profs ?? []).map((p) => ({
        id: p.id,
        name: p.full_name ?? "—",
        phone: p.phone,
        district: districts.get(p.id) ?? "—",
        mothers: mothersCount.get(p.id) ?? 0,
        visitsMonth: visitsCount.get(p.id) ?? 0,
        lastActive: lastActive.get(p.id) ?? null,
      })),
    );
  }

  const totals = useMemo(
    () => ({
      count: workers.length,
      mothers: workers.reduce((s, w) => s + w.mothers, 0),
      visits: workers.reduce((s, w) => s + w.visitsMonth, 0),
    }),
    [workers],
  );

  return (
    <ProgramShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">CHW workers</h1>
          <p className="mt-1 font-sans text-sm text-gray-500">
            {totals.count} active · {totals.mothers} mothers · {totals.visits} visits this month
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-eve-teal px-4 py-2 font-sans text-sm font-medium text-white hover:bg-eve-teal-dark"
        >
          Add CHW
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Mothers</th>
              <th className="px-4 py-3">Visits (month)</th>
              <th className="px-4 py-3">Last active</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No CHW workers registered yet.</td></tr>
            )}
            {workers.map((w) => (
              <tr key={w.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                <td className="px-4 py-3 text-gray-600">{w.district}</td>
                <td className="px-4 py-3 text-gray-600">{w.phone ?? "—"}</td>
                <td className="px-4 py-3 text-gray-900">{w.mothers}</td>
                <td className="px-4 py-3 text-gray-900">{w.visitsMonth}</td>
                <td className="px-4 py-3 text-gray-600">
                  {w.lastActive ? new Date(w.lastActive).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-sans text-lg font-semibold text-gray-900">Add CHW worker</h2>
            <p className="mt-1 font-sans text-xs text-gray-500">
              Creates an invitation record. The worker will sign up with this phone number and be auto-linked.
            </p>
            <div className="mt-4 space-y-3">
              <input
                placeholder="Full name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm"
              />
              <input
                placeholder="Phone (e.g. +212…)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm"
              />
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm"
              >
                <option value="MA">Morocco</option>
                <option value="DZ">Algeria</option>
                <option value="TN">Tunisia</option>
                <option value="SN">Senegal</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm">Cancel</button>
              <button
                onClick={() => { setOpen(false); setForm({ full_name: "", phone: "", country: "MA" }); }}
                className="rounded-lg bg-eve-teal px-4 py-2 font-sans text-sm font-medium text-white"
              >
                Send invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </ProgramShell>
  );
}
