import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/leads")({
  component: LeadsPage,
});

type Lead = {
  id: string;
  customer_display_name: string | null;
  life_stage: string | null;
  need: string | null;
  location: string | null;
  language: string | null;
  payment_preference: string | null;
  source: string;
  source_content_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const STATUSES = ["new", "contacted", "booked", "completed", "closed"] as const;

const STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-800",
  booked: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-800",
  closed: "bg-gray-200 text-gray-600",
};

function LeadsPage() {
  const [variant, setVariant] = useState<"provider" | "vendor">("vendor");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [rows, setRows] = useState<Lead[]>([]);
  const [contentTitles, setContentTitles] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", auth.user.id)
      .maybeSingle();
    setVariant(prof?.user_type === "provider" ? "provider" : "vendor");
    const { data: v } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!v) {
      setLoading(false);
      return;
    }
    setVendorId(v.id);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("vendor_id", v.id)
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Lead[];
    setRows(list);
    const contentIds = Array.from(
      new Set(list.map((l) => l.source_content_id).filter(Boolean) as string[]),
    );
    if (contentIds.length) {
      const { data: contents } = await supabase
        .from("vendor_content")
        .select("id,title")
        .in("id", contentIds);
      const map: Record<string, string> = {};
      contents?.forEach((c) => (map[c.id] = c.title));
      setContentTitles(map);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <EdenShell variant={variant} allowedTypes={["provider", "vendor"]}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">New leads</h1>
          <p className="mt-1 font-sans text-sm text-gray-500">
            Customers who reached out through search, content, referrals, community, or navigator.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-eve-teal-light text-eve-teal">
          <Users className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium capitalize",
              filter === s
                ? "bg-eve-teal text-white"
                : "bg-white text-gray-600 border border-gray-200",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : !vendorId ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Complete your vendor onboarding to receive leads.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            No leads here yet. Publish content and update your listing to attract more.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((l) => (
              <li key={l.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-sans text-sm font-semibold text-gray-900">
                        {l.customer_display_name ?? "Anonymous customer"}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] capitalize",
                          STATUS_STYLE[l.status] ?? "bg-gray-100",
                        )}
                      >
                        {l.status}
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-xs text-gray-500">
                      {[l.life_stage, l.need, l.location, l.language, l.payment_preference]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                    <p className="mt-2 font-sans text-[11px] text-eve-teal">
                      Source: <span className="capitalize">{l.source}</span>
                      {l.source_content_id && contentTitles[l.source_content_id] && (
                        <> — from “{contentTitles[l.source_content_id]}”</>
                      )}
                    </p>
                    {l.notes && (
                      <p className="mt-2 font-sans text-xs text-gray-700">{l.notes}</p>
                    )}
                  </div>
                  <select
                    value={l.status}
                    onChange={(e) => updateStatus(l.id, e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </EdenShell>
  );
}
