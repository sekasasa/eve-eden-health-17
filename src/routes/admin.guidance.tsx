import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/shells/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/guidance")({
  component: AdminGuidance,
});

type Row = {
  id: string;
  title: string;
  body: string | null;
  category: string | null;
  language: string | null;
  country: string | null;
  week_min: number | null;
  week_max: number | null;
  is_published: boolean | null;
  reviewed_by: string | null;
  reviewer?: { full_name: string | null } | null;
};

type ReviewerOpt = { id: string; full_name: string | null };

const CATEGORIES = ["nutrition", "exercise", "preparation", "warning_signs", "wellbeing"];
const LANGUAGES = ["fr", "ar", "en", "ber"];
const COUNTRIES = ["ALL", "MA", "UG"];

function AdminGuidance() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ReviewerOpt[]>([]);
  const [filters, setFilters] = useState({ category: "", language: "", country: "", week: "" });
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("guidance_content")
      .select("*")
      .order("week_min", { ascending: true });
    const list = (data ?? []) as Row[];
    const reviewerIds = Array.from(new Set(list.map((r) => r.reviewed_by).filter(Boolean) as string[]));
    if (reviewerIds.length) {
      const { data: provs } = await supabase.from("providers").select("id,full_name").in("id", reviewerIds);
      const map = new Map((provs ?? []).map((p) => [p.id, p.full_name]));
      list.forEach((r) => { r.reviewer = r.reviewed_by ? { full_name: map.get(r.reviewed_by) ?? null } : null; });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.from("providers").select("id,full_name").eq("is_verified", true).order("full_name")
      .then(({ data }) => setProviders(data ?? []));
  }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (!filters.category || r.category === filters.category) &&
    (!filters.language || r.language === filters.language) &&
    (!filters.country || r.country === filters.country) &&
    (!filters.week || (r.week_min ?? 0) <= Number(filters.week) && (r.week_max ?? 99) >= Number(filters.week))
  ), [rows, filters]);

  const togglePub = async (r: Row) => {
    const { error } = await supabase.from("guidance_content").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    const { error } = await supabase.from("guidance_content").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const save = async () => {
    if (!editing?.title || !editing?.body) return toast.error("Title and body required");
    const payload = {
      title: editing.title,
      body: editing.body,
      category: editing.category || null,
      language: editing.language || "fr",
      country: editing.country || "ALL",
      week_min: editing.week_min ?? null,
      week_max: editing.week_max ?? null,
      reviewed_by: editing.reviewed_by || null,
      is_published: editing.is_published ?? true,
    };
    const op = editing.id
      ? supabase.from("guidance_content").update(payload).eq("id", editing.id)
      : supabase.from("guidance_content").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-eve-teal-dark">Guidance content</h1>
          <p className="mt-1 font-sans text-sm text-eve-muted">Curate week-by-week advice surfaced in Eve.</p>
        </div>
        <Button onClick={() => setEditing({ is_published: true, language: "fr", country: "ALL" })} className="bg-eve-teal text-white hover:bg-eve-teal-dark">
          <Plus className="mr-1 h-4 w-4" /> Add content
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="rounded-lg border border-eve-muted/20 bg-white px-3 py-1.5 font-sans text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} className="rounded-lg border border-eve-muted/20 bg-white px-3 py-1.5 font-sans text-sm">
          <option value="">All languages</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
        <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })} className="rounded-lg border border-eve-muted/20 bg-white px-3 py-1.5 font-sans text-sm">
          <option value="">All countries</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Input
          type="number" min={1} max={42} placeholder="Week"
          value={filters.week} onChange={(e) => setFilters({ ...filters, week: e.target.value })}
          className="w-24"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-eve-muted/15 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-eve-cream/50 text-eve-muted">
            <tr>
              <th className="px-4 py-3 text-left font-sans font-medium">Weeks</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Title</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Category</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Lang</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Country</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Reviewer</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-eve-muted">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-eve-muted">No content matches your filters.</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-eve-muted/10 hover:bg-eve-cream/30">
                <td className="px-4 py-3 font-sans text-eve-muted">{r.week_min ?? "?"}–{r.week_max ?? "?"}</td>
                <td className="px-4 py-3 font-sans text-eve-forest">{r.title}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{r.category ?? "—"}</td>
                <td className="px-4 py-3 font-sans uppercase text-eve-muted">{r.language ?? "fr"}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{r.country ?? "ALL"}</td>
                <td className="px-4 py-3 font-sans text-xs text-eve-muted">{r.reviewer?.full_name ?? "—"}</td>
                <td className="px-4 py-3"><Switch checked={!!r.is_published} onCheckedChange={() => togglePub(r)} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(r)} className="mr-3 font-sans text-xs text-eve-teal hover:underline">Edit</button>
                  <button onClick={() => remove(r)} className="font-sans text-xs text-red-600 hover:underline">
                    <Trash2 className="inline h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit content" : "Add content"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-eve-muted">Week min</label>
                  <Input type="number" min={1} max={42} value={editing.week_min ?? ""}
                    onChange={(e) => setEditing({ ...editing, week_min: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <label className="text-xs text-eve-muted">Week max</label>
                  <Input type="number" min={1} max={42} value={editing.week_max ?? ""}
                    onChange={(e) => setEditing({ ...editing, week_max: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-eve-muted">Title</label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-eve-muted">Body</label>
                <Textarea rows={6} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-eve-muted">Category</label>
                  <select value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value || null })} className="w-full rounded-lg border border-eve-muted/20 bg-white px-3 py-2 text-sm">
                    <option value="">—</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-eve-muted">Language</label>
                  <select value={editing.language ?? "fr"} onChange={(e) => setEditing({ ...editing, language: e.target.value })} className="w-full rounded-lg border border-eve-muted/20 bg-white px-3 py-2 text-sm">
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-eve-muted">Country</label>
                  <select value={editing.country ?? "ALL"} onChange={(e) => setEditing({ ...editing, country: e.target.value })} className="w-full rounded-lg border border-eve-muted/20 bg-white px-3 py-2 text-sm">
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-eve-muted">Reviewer (verified provider)</label>
                <select value={editing.reviewed_by ?? ""} onChange={(e) => setEditing({ ...editing, reviewed_by: e.target.value || null })} className="w-full rounded-lg border border-eve-muted/20 bg-white px-3 py-2 text-sm">
                  <option value="">— None —</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_published ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                <span className="text-sm">Published</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} className="bg-eve-teal text-white hover:bg-eve-teal-dark">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
