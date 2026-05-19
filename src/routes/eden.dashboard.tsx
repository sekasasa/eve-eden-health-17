import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eden/dashboard")({
  component: EdenDashboard,
});

type Appt = {
  id: string;
  scheduled_at: string;
  status: string | null;
  type: string | null;
  mother_id: string;
  notes: string | null;
  mother: { id: string; full_name: string | null; pregnancy_week: number | null } | null;
};

type KPI = { label: string; value: number; delta: number };

function initials(n?: string | null) {
  if (!n) return "·";
  return n.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EdenDashboard() {
  const [name, setName] = useState<string>("");
  const [kpis, setKpis] = useState<KPI[]>([
    { label: "Active patients", value: 0, delta: 0 },
    { label: "Appointments this week", value: 0, delta: 0 },
    { label: "Pending confirmations", value: 0, delta: 0 },
    { label: "No-shows this month", value: 0, delta: 0 },
  ]);
  const [today, setToday] = useState<Appt[]>([]);
  const [recent, setRecent] = useState<
    { id: string; full_name: string | null; pregnancy_week: number | null; last_visit: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: p } = await supabase
        .from("providers")
        .select("id,full_name")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!p) {
        setLoading(false);
        return;
      }
      setName(p.full_name ?? "");

      const now = new Date();
      const startToday = new Date(now);
      startToday.setHours(0, 0, 0, 0);
      const endToday = new Date(startToday);
      endToday.setDate(endToday.getDate() + 1);
      const weekStart = new Date(startToday);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const last30 = new Date(now.getTime() - 30 * 86400000);
      const prev30 = new Date(now.getTime() - 60 * 86400000);

      const { data: all } = await supabase
        .from("appointments")
        .select(
          "id,scheduled_at,status,type,mother_id,notes,mother:mothers(id,full_name,pregnancy_week)",
        )
        .eq("provider_id", p.id)
        .order("scheduled_at", { ascending: true });

      const list = (all as unknown as Appt[]) ?? [];

      const active30 = new Set(
        list
          .filter((a) => new Date(a.scheduled_at) >= last30)
          .map((a) => a.mother_id),
      ).size;
      const activePrev = new Set(
        list
          .filter((a) => {
            const d = new Date(a.scheduled_at);
            return d >= prev30 && d < last30;
          })
          .map((a) => a.mother_id),
      ).size;

      const week = list.filter((a) => {
        const d = new Date(a.scheduled_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      const weekPrev = list.filter((a) => {
        const d = new Date(a.scheduled_at);
        const ws = new Date(weekStart);
        ws.setDate(ws.getDate() - 7);
        return d >= ws && d < weekStart;
      }).length;

      const pending = list.filter(
        (a) => a.status === "pending" && new Date(a.scheduled_at) >= now,
      ).length;

      const noShows = list.filter((a) => {
        const d = new Date(a.scheduled_at);
        return a.status === "cancelled" && d >= monthStart && d < monthEnd;
      }).length;
      const noShowsPrev = list.filter((a) => {
        const d = new Date(a.scheduled_at);
        const ps = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const pe = monthStart;
        return a.status === "cancelled" && d >= ps && d < pe;
      }).length;

      const pct = (cur: number, prev: number) =>
        prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

      setKpis([
        { label: "Active patients", value: active30, delta: pct(active30, activePrev) },
        { label: "Appointments this week", value: week, delta: pct(week, weekPrev) },
        { label: "Pending confirmations", value: pending, delta: 0 },
        { label: "No-shows this month", value: noShows, delta: pct(noShows, noShowsPrev) },
      ]);

      setToday(
        list.filter((a) => {
          const d = new Date(a.scheduled_at);
          return d >= startToday && d < endToday;
        }),
      );

      // recent patients: distinct mothers from past appointments, latest first
      const seen = new Set<string>();
      const recents: typeof recent = [];
      for (const a of [...list].reverse()) {
        if (new Date(a.scheduled_at) > now) continue;
        if (!a.mother || seen.has(a.mother.id)) continue;
        seen.add(a.mother.id);
        recents.push({
          id: a.mother.id,
          full_name: a.mother.full_name,
          pregnancy_week: a.mother.pregnancy_week,
          last_visit: a.scheduled_at,
        });
        if (recents.length >= 5) break;
      }
      setRecent(recents);
      setLoading(false);
    })();
  }, []);

  const greet = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();
  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function markComplete(id: string) {
    await supabase.from("appointments").update({ status: "completed" }).eq("id", id);
    setToday((xs) => xs.map((a) => (a.id === id ? { ...a, status: "completed" } : a)));
  }

  return (
    <EdenShell>
      <div>
        <h1 className="font-sans text-2xl font-medium text-gray-900">
          {greet}, {name ? `Dr. ${name.split(" ").slice(-1)[0]}` : "Doctor"}
        </h1>
        <p className="mt-1 font-sans text-sm text-gray-500">
          Here is your practice at a glance — {todayStr}
        </p>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} loading={loading} />
        ))}
      </div>

      {/* Today's schedule */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-sans text-base font-medium text-gray-900">Today's schedule</h2>
          <Link to="/eden/appointments" className="font-sans text-xs text-eve-teal hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="p-5">
            <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : today.length === 0 ? (
          <p className="px-5 py-8 text-center font-sans text-sm text-gray-500">
            No appointments today.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {today.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {fmtTime(a.scheduled_at)}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {a.mother?.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{a.type ?? "Visit"}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/eden/patients/$id"
                        params={{ id: a.mother?.id ?? "" }}
                        className="mr-3 text-xs text-eve-teal hover:underline"
                      >
                        View patient
                      </Link>
                      {a.status !== "completed" && (
                        <button
                          onClick={() => markComplete(a.id)}
                          className="text-xs text-gray-600 hover:text-eve-teal-dark hover:underline"
                        >
                          Mark complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent patients */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-sans text-base font-medium text-gray-900">Recent patients</h2>
          <Link to="/eden/patients" className="font-sans text-xs text-eve-teal hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="p-5">
            <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : recent.length === 0 ? (
          <p className="px-5 py-8 text-center font-sans text-sm text-gray-500">
            No recent patients.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-teal/10 font-sans text-sm font-medium text-eve-teal-dark">
                  {initials(r.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm font-medium text-gray-900 truncate">
                    {r.full_name ?? "Patient"}
                  </p>
                  <p className="font-sans text-xs text-gray-500">
                    Last visit{" "}
                    {new Date(r.last_visit).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · Week {r.pregnancy_week ?? "—"}
                  </p>
                </div>
                <Link
                  to="/eden/patients/$id"
                  params={{ id: r.id }}
                  className="font-sans text-xs text-eve-teal hover:underline"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </EdenShell>
  );
}

function KpiCard({ kpi, loading }: { kpi: KPI; loading: boolean }) {
  const up = kpi.delta >= 0;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="font-sans text-xs uppercase tracking-wide text-gray-500">
        {kpi.label}
      </p>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-100" />
      ) : (
        <div className="mt-2 flex items-end justify-between">
          <span className="font-sans text-[32px] font-bold leading-none text-eve-forest">
            {kpi.value}
          </span>
          {kpi.delta !== 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-sans text-xs",
                up ? "text-green-600" : "text-red-600",
              )}
            >
              {up ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(kpi.delta)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    confirmed: "bg-eve-teal/10 text-eve-teal-dark",
    pending: "bg-amber-100 text-amber-800",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
  };
  const s = status ?? "pending";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 font-sans text-[11px] capitalize",
        map[s] ?? map.pending,
      )}
    >
      {s}
    </span>
  );
}
