import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chw/mothers")({
  component: ChwMothers,
});

type Mother = {
  id: string;
  mother_name: string;
  village: string | null;
  due_date: string | null;
  risk_level: string | null;
  last_visit_date: string | null;
};

const FILTERS = ["All", "High risk", "Due this month", "Not visited 2w"] as const;

function pregnancyWeek(due: string | null): number | null {
  if (!due) return null;
  const dueMs = new Date(due).getTime();
  if (Number.isNaN(dueMs)) return null;
  const weeksUntil = (dueMs - Date.now()) / (1000 * 60 * 60 * 24 * 7);
  const week = 40 - Math.round(weeksUntil);
  return Math.max(0, Math.min(45, week));
}

function ChwMothers() {
  const [mothers, setMothers] = useState<Mother[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("chw_mothers")
        .select("id,mother_name,village,due_date,risk_level,last_visit_date")
        .eq("chw_id", auth.user.id)
        .order("created_at", { ascending: false });
      setMothers(data ?? []);
      setLoading(false);
    })();
  }, []);

  const list = useMemo(() => {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
    return mothers.filter((m) => {
      if (filter === "High risk") return m.risk_level === "high";
      if (filter === "Due this month") {
        if (!m.due_date) return false;
        const d = new Date(m.due_date);
        return d >= now && d <= monthEnd;
      }
      if (filter === "Not visited 2w") {
        if (!m.last_visit_date) return true;
        return new Date(m.last_visit_date) < twoWeeksAgo;
      }
      return true;
    });
  }, [mothers, filter]);

  return (
    <CHWShell>
      <h1 className="font-serif text-2xl text-eve-teal-dark">My mothers</h1>
      <p className="mt-1 font-sans text-xs text-eve-muted">
        {mothers.length} registered
      </p>

      <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 font-sans text-xs",
              filter === f
                ? "bg-eve-teal text-white border-eve-teal"
                : "bg-white text-gray-600 border-gray-200",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 h-24 animate-pulse rounded-lg bg-gray-100" />
      ) : list.length === 0 ? (
        <p className="mt-10 text-center font-sans text-sm text-eve-muted">No mothers.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((m) => {
            const week = pregnancyWeek(m.due_date);
            const border =
              m.risk_level === "high"
                ? "border-l-[3px] border-l-red-500"
                : m.risk_level === "medium"
                  ? "border-l-[3px] border-l-amber-500"
                  : "";
            return (
              <li
                key={m.id}
                className={cn("rounded-xl border border-gray-100 bg-white p-3", border)}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-medium text-gray-900 truncate">
                      {m.mother_name}
                    </p>
                    <p className="font-sans text-xs text-eve-muted truncate">
                      {m.village ?? "—"}
                      {week !== null && ` · Week ${week}`}
                    </p>
                    <p className="mt-1 font-sans text-[11px] text-eve-muted">
                      Last visit:{" "}
                      {m.last_visit_date
                        ? new Date(m.last_visit_date).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <RiskBadge level={m.risk_level} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    to="/chw/mothers/$id/visit"
                    params={{ id: m.id }}
                    className="flex-1 rounded-full bg-eve-teal py-2 text-center font-sans text-xs font-medium text-white"
                  >
                    Record visit
                  </Link>
                  <Link
                    to="/chw/mothers/$id/visit"
                    params={{ id: m.id }}
                    className="flex-1 rounded-full border border-gray-200 py-2 text-center font-sans text-xs text-gray-700"
                  >
                    View
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CHWShell>
  );
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level || level === "low") return null;
  const styles =
    level === "high"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-800";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] capitalize",
        styles,
      )}
    >
      {level}
    </span>
  );
}
