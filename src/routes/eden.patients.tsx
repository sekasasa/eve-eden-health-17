import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eden/patients")({
  component: EdenPatients,
});

type Patient = {
  id: string;
  full_name: string | null;
  city: string | null;
  pregnancy_week: number | null;
  due_date: string | null;
  phone: string | null;
  last_appt: string | null;
  risk: "low" | "medium" | "high";
};

type Filter = "all" | "active" | "high" | "due_month" | "postpartum";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "high", label: "High-risk" },
  { id: "due_month", label: "Due this month" },
  { id: "postpartum", label: "Postpartum" },
];

const PAGE = 20;

function initials(n?: string | null) {
  if (!n) return "·";
  return n.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

function deriveRisk(p: { pregnancy_week: number | null; due_date: string | null }): Patient["risk"] {
  const w = p.pregnancy_week ?? 0;
  if (w >= 37) return "medium";
  if (w > 0 && w < 12) return "medium";
  return "low";
}

function EdenPatients() {
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: prov } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!prov) {
        setLoading(false);
        return;
      }
      const { data: appts } = await supabase
        .from("appointments")
        .select("scheduled_at,mother_id,mother:mothers(id,full_name,city,pregnancy_week,due_date,phone)")
        .eq("provider_id", prov.id)
        .order("scheduled_at", { ascending: false });

      const seen = new Map<string, Patient>();
      const now = new Date();
      for (const a of (appts ?? []) as Array<{
        scheduled_at: string;
        mother_id: string;
        mother: {
          id: string;
          full_name: string | null;
          city: string | null;
          pregnancy_week: number | null;
          due_date: string | null;
          phone: string | null;
        } | null;
      }>) {
        if (!a.mother) continue;
        const past = new Date(a.scheduled_at) <= now;
        const existing = seen.get(a.mother.id);
        if (existing) {
          if (past && !existing.last_appt) existing.last_appt = a.scheduled_at;
          continue;
        }
        seen.set(a.mother.id, {
          id: a.mother.id,
          full_name: a.mother.full_name,
          city: a.mother.city,
          pregnancy_week: a.mother.pregnancy_week,
          due_date: a.mother.due_date,
          phone: a.mother.phone,
          last_appt: past ? a.scheduled_at : null,
          risk: deriveRisk(a.mother),
        });
      }
      setRows(Array.from(seen.values()));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return rows.filter((r) => {
      if (ql) {
        const hay = `${r.full_name ?? ""} ${r.phone ?? ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      switch (filter) {
        case "active":
          return (r.pregnancy_week ?? 0) > 0 && (r.pregnancy_week ?? 0) < 42;
        case "high":
          return r.risk === "high";
        case "due_month":
          if (!r.due_date) return false;
          const dd = new Date(r.due_date);
          return dd >= now && dd < monthEnd;
        case "postpartum":
          return (r.pregnancy_week ?? 0) >= 40;
        default:
          return true;
      }
    });
  }, [rows, q, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageRows = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <EdenShell>
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-medium text-gray-900">My patients</h1>
        <PrimaryButton className="px-4 py-2 text-sm">+ Add patient</PrimaryButton>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or phone"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 font-sans text-sm placeholder:text-gray-400 focus:border-eve-teal focus:outline-none focus:ring-1 focus:ring-eve-teal"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 font-sans text-xs transition-colors",
                filter === f.id
                  ? "border-eve-teal bg-eve-teal text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-5">
            <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : pageRows.length === 0 ? (
          <p className="px-5 py-10 text-center font-sans text-sm text-gray-500">
            No patients match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Week</th>
                  <th className="px-5 py-3 font-medium">Due date</th>
                  <th className="px-5 py-3 font-medium">Last appointment</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-teal/10 font-sans text-xs font-medium text-eve-teal-dark">
                          {initials(r.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {r.full_name ?? "Patient"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{r.city ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-eve-teal/10 px-2 py-0.5 text-[11px] font-medium text-eve-teal-dark">
                        Week {r.pregnancy_week ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {r.due_date
                        ? new Date(r.due_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {r.last_appt
                        ? new Date(r.last_appt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <RiskPill risk={r.risk} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/eden/patients/$id"
                        params={{ id: r.id }}
                        className="mr-3 text-xs text-eve-teal hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        to="/eden/appointments"
                        className="text-xs text-gray-600 hover:text-eve-teal-dark hover:underline"
                      >
                        Book appointment
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 font-sans text-xs text-gray-600">
            <span>
              Page {page} of {totalPages} · {filtered.length} patients
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </EdenShell>
  );
}

function RiskPill({ risk }: { risk: Patient["risk"] }) {
  const map = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-700",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        map[risk],
      )}
    >
      {risk}
    </span>
  );
}
