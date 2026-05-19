import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProgramShell } from "@/components/shells/ProgramShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/program/overview")({
  component: ProgramOverview,
});

type Kpi = {
  mothers: number;
  chws: number;
  visits30: number;
  highRiskOpen: number;
  referrals30: number;
};

type Alert = {
  id: string;
  risk_type: string;
  created_at: string;
  resolved: boolean;
  mother_name?: string;
  village?: string;
  chw_name?: string;
};

type RegionDot = { city: string; count: number; risk: "low" | "medium" | "high"; x: number; y: number };

// Approximate dot positions for Moroccan cities on a 600x500 canvas
const MA_CITIES: Record<string, { x: number; y: number }> = {
  Casablanca: { x: 180, y: 220 },
  Rabat: { x: 220, y: 175 },
  Marrakech: { x: 245, y: 305 },
  Fes: { x: 320, y: 195 },
  Tanger: { x: 240, y: 95 },
  Agadir: { x: 165, y: 360 },
  Oujda: { x: 430, y: 165 },
  Meknes: { x: 295, y: 200 },
};

function ProgramOverview() {
  const [kpi, setKpi] = useState<Kpi>({ mothers: 0, chws: 0, visits30: 0, highRiskOpen: 0, referrals30: 0 });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [regions, setRegions] = useState<RegionDot[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

      const [mothersRes, chwRes, visitsRes, riskRes, refRes, alertsRes] = await Promise.all([
        supabase.from("chw_mothers").select("id,village,district,risk_level", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("user_type", "chw"),
        supabase.from("visits").select("id,referred", { count: "exact" }).gte("visit_date", since),
        supabase.from("chw_alerts").select("id", { count: "exact", head: true }).eq("resolved", false),
        supabase.from("visits").select("id", { count: "exact", head: true }).gte("visit_date", since).eq("referred", true),
        supabase.from("chw_alerts").select("id,risk_type,created_at,resolved,mother_id,chw_id").order("created_at", { ascending: false }).limit(8),
      ]);

      setKpi({
        mothers: mothersRes.count ?? 0,
        chws: chwRes.count ?? 0,
        visits30: visitsRes.count ?? 0,
        highRiskOpen: riskRes.count ?? 0,
        referrals30: refRes.count ?? 0,
      });

      // Build region dots from chw_mothers rows
      const cityMap = new Map<string, { count: number; high: number; med: number }>();
      (mothersRes.data ?? []).forEach((m) => {
        const city = (m.district || m.village || "").trim();
        if (!city) return;
        const e = cityMap.get(city) ?? { count: 0, high: 0, med: 0 };
        e.count++;
        if (m.risk_level === "high") e.high++;
        else if (m.risk_level === "medium") e.med++;
        cityMap.set(city, e);
      });
      const dots: RegionDot[] = [];
      cityMap.forEach((v, city) => {
        const pos = MA_CITIES[city];
        if (!pos) return;
        const risk: "low" | "medium" | "high" = v.high > 0 ? "high" : v.med > 0 ? "medium" : "low";
        dots.push({ city, count: v.count, risk, x: pos.x, y: pos.y });
      });
      setRegions(dots);

      // Hydrate alerts with mother + chw
      const alertRows = alertsRes.data ?? [];
      const motherIds = [...new Set(alertRows.map((a) => a.mother_id))];
      const chwIds = [...new Set(alertRows.map((a) => a.chw_id))];
      const [mResult, pResult] = await Promise.all([
        motherIds.length
          ? supabase.from("chw_mothers").select("id,mother_name,village").in("id", motherIds)
          : Promise.resolve({ data: [] as { id: string; mother_name: string; village: string | null }[] }),
        chwIds.length
          ? supabase.from("profiles").select("id,full_name").in("id", chwIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
      ]);
      const motherMap = new Map((mResult.data ?? []).map((m) => [m.id, m]));
      const chwMap = new Map((pResult.data ?? []).map((p) => [p.id, p]));
      setAlerts(
        alertRows.map((a) => ({
          id: a.id,
          risk_type: a.risk_type,
          created_at: a.created_at,
          resolved: a.resolved,
          mother_name: motherMap.get(a.mother_id)?.mother_name ?? "—",
          village: motherMap.get(a.mother_id)?.village ?? "—",
          chw_name: chwMap.get(a.chw_id)?.full_name ?? "—",
        })),
      );
    })();
  }, []);

  async function resolve(id: string) {
    await supabase.from("chw_alerts").update({ resolved: true }).eq("id", id);
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, resolved: true } : x)));
  }

  return (
    <ProgramShell>
      <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Program overview</h1>
      <p className="mt-1 font-sans text-sm text-gray-500">Real-time field operations summary.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi label="Mothers registered" value={kpi.mothers} />
        <Kpi label="Active CHW workers" value={kpi.chws} />
        <Kpi label="Home visits (30d)" value={kpi.visits30} />
        <Kpi label="High-risk open" value={kpi.highRiskOpen} accent="red" />
        <Kpi label="Referrals (30d)" value={kpi.referrals30} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 lg:col-span-2">
          <h2 className="font-sans text-sm font-semibold text-gray-900">Mother distribution by region</h2>
          <p className="mt-0.5 font-sans text-xs text-gray-500">Dot size = mother count · colour = highest risk</p>
          <svg viewBox="0 0 600 500" className="mt-4 h-[360px] w-full">
            {/* Stylised Morocco outline */}
            <path
              d="M 80 120 L 180 70 L 290 60 L 410 80 L 500 130 L 530 200 L 510 290 L 470 360 L 380 410 L 280 430 L 200 410 L 140 360 L 90 270 Z"
              fill="#f3f4f6"
              stroke="#e5e7eb"
              strokeWidth="1.5"
            />
            {regions.map((d) => {
              const r = Math.min(28, 6 + d.count * 2);
              const color =
                d.risk === "high" ? "#ef4444" : d.risk === "medium" ? "#f59e0b" : "#0d9488";
              return (
                <g key={d.city}>
                  <circle cx={d.x} cy={d.y} r={r} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={1.5} />
                  <circle cx={d.x} cy={d.y} r={3} fill={color} />
                  <text x={d.x} y={d.y - r - 4} textAnchor="middle" className="font-sans" fontSize="11" fill="#374151">
                    {d.city} · {d.count}
                  </text>
                </g>
              );
            })}
            {regions.length === 0 && (
              <text x="300" y="250" textAnchor="middle" className="font-sans" fontSize="13" fill="#9ca3af">
                No region data yet
              </text>
            )}
          </svg>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="font-sans text-sm font-semibold text-gray-900">Recent alerts</h2>
          <ul className="mt-4 space-y-3">
            {alerts.length === 0 && <li className="font-sans text-xs text-gray-500">No alerts.</li>}
            {alerts.map((a) => (
              <li key={a.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-medium text-gray-900 truncate">{a.mother_name}</p>
                    <p className="font-sans text-xs text-gray-500 truncate">
                      {a.village} · {a.risk_type}
                    </p>
                    <p className="mt-0.5 font-sans text-[11px] text-gray-400">
                      {new Date(a.created_at).toLocaleString()} · {a.chw_name}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px]",
                      a.resolved ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700",
                    )}
                  >
                    {a.resolved ? "Resolved" : "Open"}
                  </span>
                </div>
                {!a.resolved && (
                  <button
                    onClick={() => resolve(a.id)}
                    className="mt-2 rounded-md border border-gray-200 px-2 py-1 font-sans text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Mark resolved
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProgramShell>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: "red" }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <p className="font-sans text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p
        className={cn(
          "mt-2 font-sans text-3xl font-semibold",
          accent === "red" ? "text-red-600" : "text-eve-teal-dark",
        )}
      >
        {value}
      </p>
    </div>
  );
}
