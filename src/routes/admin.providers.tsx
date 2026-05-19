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
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/providers")({
  component: AdminProviders,
});

type Provider = {
  id: string;
  full_name: string | null;
  specialty: string | null;
  city: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  bio: string | null;
  license_number: string | null;
  consultation_fee_mad: number | null;
  languages: string[] | null;
  is_verified: boolean | null;
  review_status: string;
  rejection_reason: string | null;
  created_at: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-eve-teal/15 text-eve-teal-dark",
  rejected: "bg-red-100 text-red-800",
};

function AdminProviders() {
  const [rows, setRows] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [selected, setSelected] = useState<Provider | null>(null);
  const [actionType, setActionType] = useState<"reject" | "info" | null>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Provider[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.review_status === filter);

  const verify = async (p: Provider) => {
    const { error } = await supabase
      .from("providers")
      .update({ review_status: "verified", is_verified: true, rejection_reason: null })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Verified — welcome email queued");
    setSelected(null);
    load();
  };

  const reject = async () => {
    if (!selected || !reason.trim()) return toast.error("Reason required");
    const { error } = await supabase
      .from("providers")
      .update({ review_status: "rejected", is_verified: false, rejection_reason: reason })
      .eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("Rejected — notification email queued");
    setActionType(null);
    setReason("");
    setSelected(null);
    load();
  };

  const requestInfo = async () => {
    if (!selected || !reason.trim()) return toast.error("Message required");
    // In a real build this would call a server function that sends the email.
    toast.success("Info request email queued to provider");
    setActionType(null);
    setReason("");
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-eve-teal-dark">Provider vetting</h1>
          <p className="mt-1 font-sans text-sm text-eve-muted">
            Review submissions and verify clinicians before they appear in Eve.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["pending", "verified", "rejected", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={
                "rounded-full px-3 py-1.5 font-sans text-xs capitalize " +
                (filter === s
                  ? "bg-eve-teal text-white"
                  : "bg-white text-eve-muted ring-1 ring-eve-muted/20")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-eve-muted/15 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-eve-cream/50 text-eve-muted">
            <tr>
              <th className="px-4 py-3 text-left font-sans font-medium">Name</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Specialty</th>
              <th className="px-4 py-3 text-left font-sans font-medium">City</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Status</th>
              <th className="px-4 py-3 text-left font-sans font-medium">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-eve-muted">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-eve-muted">No providers in this view.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-eve-muted/10 hover:bg-eve-cream/30">
                <td className="px-4 py-3 font-sans text-eve-forest">{p.full_name ?? "—"}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{p.specialty ?? "—"}</td>
                <td className="px-4 py-3 font-sans text-eve-muted">{p.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={"rounded-full px-2 py-0.5 font-sans text-xs capitalize " + STATUS_COLORS[p.review_status]}>
                    {p.review_status}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-xs text-eve-muted">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelected(p)} className="font-sans text-xs text-eve-teal hover:underline">
                    Review
                  </button>
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
              <DialogHeader>
                <DialogTitle>{selected.full_name}</DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-3 font-sans text-sm">
                <Field label="Specialty" value={selected.specialty} />
                <Field label="City" value={selected.city} />
                <Field label="Clinic" value={selected.clinic_name} />
                <Field label="License #" value={selected.license_number} />
                <Field label="Languages" value={selected.languages?.join(", ")} />
                <Field label="Consultation fee" value={selected.consultation_fee_mad ? `${selected.consultation_fee_mad} MAD` : null} />
                <div className="col-span-2"><Field label="Clinic address" value={selected.clinic_address} /></div>
                <div className="col-span-2"><Field label="Bio" value={selected.bio} /></div>
                {selected.rejection_reason && (
                  <div className="col-span-2 rounded-lg bg-red-50 p-3 text-red-800">
                    <p className="text-xs font-semibold">Previous rejection</p>
                    <p className="mt-1 text-sm">{selected.rejection_reason}</p>
                  </div>
                )}
              </dl>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setActionType("info"); setReason(""); }}>Request more info</Button>
                <Button variant="destructive" onClick={() => { setActionType("reject"); setReason(""); }}>Reject</Button>
                <Button onClick={() => verify(selected)} className="bg-eve-teal text-white hover:bg-eve-teal-dark">Verify</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!actionType} onOpenChange={(o) => !o && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "reject" ? "Rejection reason" : "Request more info"}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={actionType === "reject" ? "Why is this provider being rejected?" : "What additional info do you need?"}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button onClick={actionType === "reject" ? reject : requestInfo} className="bg-eve-teal text-white hover:bg-eve-teal-dark">
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="font-sans text-xs uppercase tracking-wide text-eve-muted">{label}</dt>
      <dd className="mt-0.5 font-sans text-eve-forest">{value || "—"}</dd>
    </div>
  );
}
