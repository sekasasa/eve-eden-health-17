import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/vendors")({
  component: AdminVendors,
});

type Vendor = {
  id: string;
  business_name: string | null;
  category: string | null;
  city: string | null;
  description: string | null;
  logo_url: string | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  commission_rate: number | null;
  review_status: string;
  rejection_reason: string | null;
  created_at: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-eve-teal/15 text-eve-teal-dark",
  rejected: "bg-red-100 text-red-800",
};

function AdminVendors() {
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [commission, setCommission] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Vendor[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selected) setCommission(((selected.commission_rate ?? 0.1) * 100).toFixed(1));
  }, [selected]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.review_status === filter);

  const verify = async (v: Vendor) => {
    const { error } = await supabase.from("vendors").update({
      review_status: "verified", is_verified: true, rejection_reason: null,
    }).eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("Verified — welcome email queued");
    setSelected(null);
    load();
  };

  const reject = async () => {
    if (!selected || !reason.trim()) return toast.error("Reason required");
    const { error } = await supabase.from("vendors").update({
      review_status: "rejected", is_verified: false, rejection_reason: reason,
    }).eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("Rejected — notification email queued");
    setReasonOpen(false); setReason(""); setSelected(null); load();
  };

  const toggleFeatured = async (v: Vendor) => {
    const { error } = await supabase.from("vendors").update({ is_featured: !v.is_featured }).eq("id", v.id);
    if (error) return toast.error(error.message);
    load();
  };

  const saveCommission = async () => {
    if (!selected) return;
    const pct = Number(commission);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return toast.error("Commission must be 0-100");
    const { error } = await supabase.from("vendors").update({ commission_rate: pct / 100 }).eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("Commission updated");
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-eve-teal-dark">Vendor vetting</h1>
          <p className="mt-1 font-sans text-sm text-eve-muted">
            Approve marketplace sellers and manage commission + featured placement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["pending", "verified", "rejected", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={
                "rounded-full px-3 py-1.5 font-sans text-xs capitalize " +
                (filter === s ? "bg-eve-teal text-white" : "bg-white text-eve-muted ring-1 ring-eve-muted/20")
              }
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-eve-muted/15 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-eve-cream/50 text-eve-muted">
            <tr>
              <th className="px-4 py-3 text-left font-sans font-medium">Business</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Category</th>
              <th className="px-4 py-3 text-left font-sans font-medium">City</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Status</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Commission</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Featured</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-eve-muted">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-eve-muted">Nothing here yet.</td></tr>}
            {filtered.map((v) => (
              <tr key={v.id} className="border-t border-eve-muted/10 hover:bg-eve-cream/30">
                <td className="px-4 py-3 font-sans text-eve-forest">{v.business_name ?? "—"}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{v.category ?? "—"}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{v.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={"rounded-full px-2 py-0.5 font-sans text-xs capitalize " + STATUS_COLORS[v.review_status]}>
                    {v.review_status}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-eve-muted">{((v.commission_rate ?? 0) * 100).toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <Switch checked={!!v.is_featured} onCheckedChange={() => toggleFeatured(v)} />
                </td>
                <td className="px-4 py-3 font-sans text-xs text-eve-muted">
                  {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelected(v)} className="font-sans text-xs text-eve-teal hover:underline">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.business_name}</DialogTitle></DialogHeader>
              <div className="space-y-3 font-sans text-sm">
                <Field label="Category" value={selected.category} />
                <Field label="City" value={selected.city} />
                <Field label="Description" value={selected.description} />
                <div>
                  <label className="font-sans text-xs uppercase tracking-wide text-eve-muted">Commission rate (%)</label>
                  <div className="mt-1 flex gap-2">
                    <Input type="number" min={0} max={100} step={0.1} value={commission} onChange={(e) => setCommission(e.target.value)} />
                    <Button variant="outline" onClick={saveCommission}>Save</Button>
                  </div>
                </div>
                {selected.rejection_reason && (
                  <div className="rounded-lg bg-red-50 p-3 text-red-800">
                    <p className="text-xs font-semibold">Previous rejection</p>
                    <p className="mt-1 text-sm">{selected.rejection_reason}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="destructive" onClick={() => { setReasonOpen(true); setReason(""); }}>Reject</Button>
                <Button onClick={() => verify(selected)} className="bg-eve-teal text-white hover:bg-eve-teal-dark">Verify</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejection reason</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason emailed to vendor" rows={5} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonOpen(false)}>Cancel</Button>
            <Button onClick={reject} className="bg-eve-teal text-white hover:bg-eve-teal-dark">Send rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-wide text-eve-muted">{label}</p>
      <p className="mt-0.5 font-sans text-eve-forest">{value || "—"}</p>
    </div>
  );
}
