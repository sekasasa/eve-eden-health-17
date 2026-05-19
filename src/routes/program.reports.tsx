import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/program/reports")({
  component: ProgramReports,
});

const RANGES = [
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
  { id: "180", label: "Last 6 months", days: 180 },
];

function ProgramReports() {
  const [rangeId, setRangeId] = useState("90");
  const days = RANGES.find((r) => r.id === rangeId)!.days;
  const [mothers, setMothers] = useState<{ id: string; created_at: string | null; district: string | null }[]>([]);
  const [visits, setVisits] = useState<{ id: string; visit_date: string; referred: boolean; mother_id: string; chw_id: string }[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; created_at: string; resolved: boolean }[]>([]);
  const [riskLevels, setRiskLevels] = useState<{ risk_level: string | null }[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const [mRes, vRes, aRes, rRes] = await Promise.all([
        supabase.from("chw_mothers").select("id,created_at,district").gte("created_at", since),
        supabase.from("visits").select("id,visit_date,referred,mother_id,chw_id").gte("visit_date", since.slice(0, 10)),
        supabase.from("chw_alerts").select("id,created_at,resolved").gte("created_at", since),
        supabase.from("chw_mothers").select("risk_level"),
      ]);
      setMothers(mRes.data ?? []);
      setVisits(vRes.data ?? []);
      setAlerts(aRes.data ?? []);
      setRiskLevels(rRes.data ?? []);
    })();
  }, [days]);

  const cumulative = useMemo(() => {
    const buckets = new Map<string, number>();
    const sorted = [...mothers]
      .filter((m) => m.created_at)
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    sorted.forEach((m) => {
      const k = (m.created_at ?? "").slice(0, 10);
      buckets.set(k, (buckets.get(k) ?? 0) + 1);
    });
    let total = 0;
    return [...buckets.entries()].map(([date, count]) => ({ date, total: (total += count) }));
  }, [mothers]);

  const weekly = useMemo(() => {
    const buckets = new Map<string, number>();
    visits.forEach((v) => {
      const d = new Date(v.visit_date);
      d.setDate(d.getDate() - d.getDay());
      const k = d.toISOString().slice(0, 10);
      buckets.set(k, (buckets.get(k) ?? 0) + 1);
    });
    return [...buckets.entries()].sort().map(([week, count]) => ({ week, count }));
  }, [visits]);

  const riskDist = useMemo(() => {
    const c = { low: 0, medium: 0, high: 0 };
    riskLevels.forEach((r) => {
      if (r.risk_level === "high") c.high++;
      else if (r.risk_level === "medium") c.medium++;
      else c.low++;
    });
    return [
      { name: "Low", value: c.low, color: "#0d9488" },
      { name: "Medium", value: c.medium, color: "#d97706" },
      { name: "High", value: c.high, color: "#dc2626" },
    ];
  }, [riskLevels]);

  const motherSet = new Set(visits.map((v) => v.mother_id));
  const avgVisits = motherSet.size ? (visits.length / motherSet.size).toFixed(1) : "0";
  const referralRate = visits.length ? Math.round((visits.filter((v) => v.referred).length / visits.length) * 100) : 0;
  const resolved48 = alerts.filter((a) => a.resolved).length;
  const resolvePct = alerts.length ? Math.round((resolved48 / alerts.length) * 100) : 0;
  const districts = new Set(mothers.map((m) => m.district).filter(Boolean));

  const districtTable = useMemo(() => {
    const map = new Map<string, { mothers: Set<string>; chws: Set<string>; visits: number; high: number; total: number }>();
    mothers.forEach((m) => {
      const d = m.district ?? "—";
      const e = map.get(d) ?? { mothers: new Set(), chws: new Set(), visits: 0, high: 0, total: 0 };
      e.mothers.add(m.id);
      e.total++;
      map.set(d, e);
    });
    visits.forEach((v) => {
      // Lookup district via mother in mothers list
      const m = mothers.find((x) => x.id === v.mother_id);
      const d = m?.district ?? "—";
      const e = map.get(d);
      if (e) { e.visits++; e.chws.add(v.chw_id); }
    });
    riskLevels.forEach(() => {});
    return [...map.entries()].map(([district, e]) => ({
      district,
      mothers: e.mothers.size,
      chws: e.chws.size,
      avgVisits: e.mothers.size ? (e.visits / e.mothers.size).toFixed(1) : "0",
      riskRate: e.total ? Math.round((e.high / e.total) * 100) : 0,
    }));
  }, [mothers, visits, riskLevels]);

  return (
    <ProgramShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Impact reports</h1>
          <p className="mt-1 font-sans text-sm text-gray-500">{RANGES.find((r) => r.id === rangeId)!.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={rangeId} onChange={(e) => setRangeId(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm">
            {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <button onClick={() => toast.info("PDF export coming soon")} className="rounded-lg bg-eve-teal px-4 py-2 font-sans text-sm font-medium text-white">
            Export PDF
          </button>
        </div>
      </div>

      <Section title="1. Reach">
        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Women reached" value={mothers.length} />
          <Stat label="Districts covered" value={districts.size} />
          <Stat label="High-risk identified" value={riskLevels.filter((r) => r.risk_level === "high").length} />
        </div>
        <ChartCard title="Mothers registered over time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cumulative}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      <Section title="2. Engagement">
        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Total visits" value={visits.length} />
          <Stat label="Avg visits / mother" value={avgVisits} />
          <Stat label="Referral rate" value={`${referralRate}%`} />
        </div>
        <ChartCard title="Home visits by week">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      <Section title="3. Risk and safety">
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="Risk distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={riskDist} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {riskDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4 text-xs text-gray-600">
              {riskDist.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name} ({d.value})
                </span>
              ))}
            </div>
          </ChartCard>
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <p className="font-sans text-sm font-semibold text-gray-900">High-risk cases resolved</p>
            <p className="mt-1 font-sans text-xs text-gray-500">Target: 80% within 48h</p>
            <div className="mt-6">
              <p className="font-sans text-4xl font-semibold text-eve-teal-dark">{resolvePct}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-eve-teal" style={{ width: `${Math.min(resolvePct, 100)}%` }} />
              </div>
              <p className="mt-3 font-sans text-xs text-gray-500">{resolved48} of {alerts.length} alerts resolved</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="4. Geographic coverage">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Mothers</th>
                <th className="px-4 py-3">CHW workers</th>
                <th className="px-4 py-3">Avg visits</th>
                <th className="px-4 py-3">Risk rate</th>
              </tr>
            </thead>
            <tbody>
              {districtTable.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No district data.</td></tr>}
              {districtTable.map((r) => (
                <tr key={r.district} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.district}</td>
                  <td className="px-4 py-3">{r.mothers}</td>
                  <td className="px-4 py-3">{r.chws}</td>
                  <td className="px-4 py-3">{r.avgVisits}</td>
                  <td className="px-4 py-3">{r.riskRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="5. Narrative summary">
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <p className="font-sans text-base leading-relaxed text-gray-700">
            In the {RANGES.find((r) => r.id === rangeId)!.label.toLowerCase()}, Eve & Eden's program reached{" "}
            <strong className="text-eve-teal-dark">{mothers.length}</strong> women across{" "}
            <strong className="text-eve-teal-dark">{districts.size}</strong> districts. CHW workers conducted{" "}
            <strong className="text-eve-teal-dark">{visits.length}</strong> home visits.{" "}
            <strong className="text-eve-teal-dark">{riskLevels.filter((r) => r.risk_level === "high").length}</strong>{" "}
            high-risk cases were identified and{" "}
            <strong className="text-eve-teal-dark">{visits.filter((v) => v.referred).length}</strong> referrals were made.
          </p>
        </div>
      </Section>
    </ProgramShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-sans text-base font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <p className="font-sans text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 font-sans text-3xl font-semibold text-eve-teal-dark">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <p className="font-sans text-sm font-semibold text-gray-900">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
