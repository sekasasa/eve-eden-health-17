import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/shells/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  user_type: string;
  country: string | null;
  language: string | null;
  is_active: boolean;
  created_at: string | null;
};

const TYPES = ["mother", "provider", "vendor", "chw", "admin"];

function AdminUsers() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Profile[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const countries = useMemo(
    () => Array.from(new Set(rows.map((r) => r.country).filter(Boolean) as string[])).sort(),
    [rows]
  );

  const filtered = rows.filter((r) =>
    (!typeFilter || r.user_type === typeFilter) &&
    (!countryFilter || r.country === countryFilter)
  );

  const toggleActive = async (p: Profile) => {
    const next = !p.is_active;
    if (!next && !confirm(`Disable ${p.full_name ?? "this account"}?`)) return;
    const { error } = await supabase.from("profiles").update({ is_active: next }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Account enabled" : "Account disabled");
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-eve-teal-dark">Users</h1>
          <p className="mt-1 font-sans text-sm text-eve-muted">All profiles across the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-eve-muted/20 bg-white px-3 py-1.5 font-sans text-sm">
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="rounded-lg border border-eve-muted/20 bg-white px-3 py-1.5 font-sans text-sm">
            <option value="">All countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-eve-muted/15 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-eve-cream/50 text-eve-muted">
            <tr>
              <th className="px-4 py-3 text-left font-sans font-medium">Name</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Type</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Country</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Language</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Status</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-eve-muted">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-eve-muted">No users match these filters.</td></tr>}
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-eve-muted/10 hover:bg-eve-cream/30">
                <td className="px-4 py-3 font-sans text-eve-forest">{p.full_name ?? "—"}</td>
                <td className="px-4 py-3 font-sans capitalize text-eve-muted">{p.user_type}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{p.country ?? "—"}</td>
                <td className="px-4 py-3 font-sans uppercase text-eve-muted">{p.language ?? "—"}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{p.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={"rounded-full px-2 py-0.5 font-sans text-xs " + (p.is_active ? "bg-eve-teal/15 text-eve-teal-dark" : "bg-red-100 text-red-800")}>
                    {p.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-xs text-eve-muted">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant={p.is_active ? "outline" : "default"} onClick={() => toggleActive(p)}>
                    {p.is_active ? "Disable" : "Enable"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
