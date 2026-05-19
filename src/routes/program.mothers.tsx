import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/program/mothers")({
  component: ProgramMothers,
});

type Row = {
  id: string;
  mother_name: string;
  village: string | null;
  district: string | null;
  due_date: string | null;
  risk_level: string | null;
  last_visit_date: string | null;
  chw_id: string;
  chw_name?: string;
};

function ProgramMothers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [chw, setChw] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chw_mothers")
        .select("id,mother_name,village,district,due_date,risk_level,last_visit_date,chw_id")
        .order("created_at", { ascending: false });
      const list = (data ?? []) as Row[];
      const chwIds = [...new Set(list.map((r) => r.chw_id))];
      if (chwIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,full_name")
          .in("id", chwIds);
        const map = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
        list.forEach((r) => (r.chw_name = map.get(r.chw_id) ?? "—"));
      }
      setRows(list);
    })();
  }, []);

  const districts = useMemo(
    () => [...new Set(rows.map((r) => r.district).filter(Boolean) as string[])].sort(),
    [rows],
  );
  const chws = useMemo(
    () => [...new Set(rows.map((r) => `${r.chw_id}|${r.chw_name ?? "—"}`))],
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (risk !== "all" && r.risk_level !== risk) return false;
      if (district !== "all" && r.district !== district) return false;
      if (chw !== "all" && r.chw_id !== chw) return false;
      if (needle && !r.mother_name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, q, risk, district, chw]);

  function exportCsv() {
    const head = ["name", "village", "district", "due_date", "risk", "last_visit", "chw"];
    const lines = [
      head.join(","),
      ...filtered.map((r) =>
        [r.mother_name, r.village ?? "", r.district ?? "", r.due_date ?? "", r.risk_level ?? "", r.last_visit_date ?? "", r.chw_name ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mothers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ProgramShell>
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Mothers</h1>
        <button
          onClick={exportCsv}
          className="rounded-lg bg-eve-teal px-4 py-2 font-sans text-sm font-medium text-white hover:bg-eve-teal-dark"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-gray-100 bg-white p-4 md:grid-cols-4">
        <input
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm focus:border-eve-teal focus:outline-none"
        />
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm">
          <option value="all">All risk levels</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm">
          <option value="all">All districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={chw} onChange={(e) => setChw(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm">
          <option value="all">All CHW workers</option>
          {chws.map((c) => {
            const [id, name] = c.split("|");
            return <option key={id} value={id}>{name}</option>;
          })}
        </select>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Mother</th>
              <th className="px-4 py-3">Village</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Last visit</th>
              <th className="px-4 py-3">CHW</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No mothers match these filters.</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{r.mother_name}</td>
                <td className="px-4 py-3 text-gray-600">{r.village ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.district ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.due_date ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.last_visit_date ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.chw_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <RiskPill level={r.risk_level} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProgramShell>
  );
}

function RiskPill({ level }: { level: string | null }) {
  const s =
    level === "high"
      ? "bg-red-100 text-red-700"
      : level === "medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-700";
  return <span className={cn("rounded-full px-2 py-0.5 font-sans text-[10px] capitalize", s)}>{level ?? "—"}</span>;
}
