import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export const Route = createFileRoute("/eden/analytics")({
  component: EdenAnalytics,
});

type Appt = {
  id: string;
  scheduled_at: string;
  status: string | null;
  type: string | null;
  mother_id: string;
  mother: { id: string; pregnancy_week: number | null } | null;
};

const RANGES = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 6 months", days: 182 },
] as const;

const TYPE_COLORS = ["#0d9488", "#c2410c", "#e11d48", "#166534"]; // eve-teal / terra / rose / forest
const TYPES = ["Consultation", "Scan", "Follow-up", "Home visit"];

function EdenAnalytics() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[0]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: p } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!p) {
        setLoading(false);
        return;
      }
      const since = new Date(Date.now() - range.days * 86400000).toISOString();
      const { data } = await supabase
        .from("appointments")
        .select("id,scheduled_at,status,type,mother_id,mother:mothers(id,pregnancy_week)")
        .eq("provider_id", p.id)
        .gte("scheduled_at", since)
        .order("scheduled_at", { ascending: true });
      setAppts((data as unknown as Appt[]) ?? []);
      setLoading(false);
    })();
  }, [range]);

  const kpis = useMemo(() => {
    const patients = new Set(appts.map((a) => a.mother_id)).size;
    const completed = appts.filter((a) => a.status === "completed").length;
    const past = appts.filter((a) => new Date(a.scheduled_at) < new Date());
    const noShows = past.filter((a) => a.status === "cancelled").length;
    const noShowRate = past.length ? Math.round((noShows / past.length) * 100) : 0;
    // marketplace profile views — mocked
    const views = Math.max(20, patients * 7);
    return [
      { label: "Patients seen", value: patients },
      { label: "Appointments completed", value: completed },
      { label: "No-show rate", value: `${noShowRate}%` },
      { label: "Marketplace profile views", value: views },
    ];
  }, [appts]);

  const timeSeries = useMemo(() => {
    const buckets = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bucketSize = range.days > 90 ? 7 : 1; // daily or weekly
    for (let i = range.days; i >= 0; i -= bucketSize) {
      const d = new Date(today.getTime() - i * 86400000);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const a of appts) {
      const d = new Date(a.scheduled_at);
      d.setHours(0, 0, 0, 0);
      const offset = Math.floor((today.getTime() - d.getTime()) / 86400000);
      const snapped = today.getTime() - Math.floor(offset / bucketSize) * bucketSize * 86400000;
      const key = new Date(snapped).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([d, count]) => ({
      date: new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    }));
  }, [appts, range]);

  const typeBreakdown = useMemo(() => {
    return TYPES.map((t) => ({
      name: t,
      value: appts.filter((a) => (a.type ?? "Consultation") === t).length,
    })).filter((d) => d.value > 0);
  }, [appts]);

  const stageDist = useMemo(() => {
    const stages = { First: 0, Second: 0, Third: 0, Postpartum: 0 };
    const seen = new Set<string>();
    for (const a of appts) {
      if (!a.mother || seen.has(a.mother.id)) continue;
      seen.add(a.mother.id);
      const w = a.mother.pregnancy_week ?? 0;
      if (w >= 40) stages.Postpartum++;
      else if (w >= 28) stages.Third++;
      else if (w >= 14) stages.Second++;
      else stages.First++;
    }
    return Object.entries(stages).map(([stage, value]) => ({ stage, value }));
  }, [appts]);

  return (
    <EdenShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-medium text-gray-900">Analytics</h1>
          <p className="mt-1 font-sans text-sm text-gray-500">
            How your practice is performing.
          </p>
        </div>
        <div className="flex rounded-md border border-gray-200 bg-white p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1 font-sans text-xs rounded",
                range.label === r.label ? "bg-eve-teal text-white" : "text-gray-600",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="font-sans text-xs uppercase tracking-wide text-gray-500">{k.label}</p>
            <p className="mt-2 font-sans text-[32px] font-bold leading-none text-eve-forest">
              {loading ? "—" : k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Volume chart */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-sans text-base font-medium text-gray-900">Appointment volume</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Type breakdown */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-sans text-base font-medium text-gray-900">Appointment types</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {typeBreakdown.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Stage distribution */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-sans text-base font-medium text-gray-900">Patient stage distribution</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageDist} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: "#64748b" }} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </EdenShell>
  );
}
