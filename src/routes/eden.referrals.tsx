import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Inbox } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/referrals")({
  component: ReferralsPage,
});

type Referral = {
  id: string;
  from_vendor_id: string;
  to_vendor_id: string | null;
  to_partner_name: string | null;
  to_category: string | null;
  customer_user_id: string;
  reason: string | null;
  urgency: string;
  notes: string | null;
  documents_requested: string[];
  permission_requested: boolean;
  follow_up_due: string | null;
  status: string;
  created_at: string;
};

const STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "appt_requested",
  "appt_confirmed",
  "checked_in",
  "completed",
  "follow_up",
  "closed",
  "declined",
] as const;

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-sky-100 text-sky-700",
  accepted: "bg-violet-100 text-violet-700",
  appt_requested: "bg-amber-100 text-amber-800",
  appt_confirmed: "bg-amber-100 text-amber-800",
  checked_in: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  follow_up: "bg-rose-100 text-rose-700",
  closed: "bg-gray-200 text-gray-600",
  declined: "bg-red-100 text-red-700",
};

const PARTNER_CATEGORIES = [
  "OB-GYN",
  "IVF clinic",
  "Lab",
  "Pharmacy",
  "Therapist",
  "Nutritionist",
  "Lactation consultant",
  "Pediatrician",
  "Doula / Midwife",
  "Insurance partner",
  "Shop / Service",
];

const DOC_TYPES = ["Lab results", "Scans", "Prescriptions", "Insurance", "Care notes"];

function ReferralsPage() {
  const [variant, setVariant] = useState<"provider" | "vendor">("vendor");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [rows, setRows] = useState<Referral[]>([]);
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    to_partner_name: "",
    to_category: "OB-GYN",
    customer_user_id: "",
    reason: "",
    urgency: "normal",
    notes: "",
    documents_requested: [] as string[],
    permission_requested: true,
    follow_up_due: "",
  });

  useEffect(() => {
    void load();
  }, [tab]);

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
    const column = tab === "sent" ? "from_vendor_id" : "to_vendor_id";
    const { data } = await supabase
      .from("referrals")
      .select("*")
      .eq(column, v.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Referral[]);
    setLoading(false);
  }

  async function send(status: "draft" | "sent") {
    if (!vendorId) return;
    if (!form.customer_user_id.trim()) return toast.error("Customer ID required");
    const { error } = await supabase.from("referrals").insert({
      from_vendor_id: vendorId,
      to_partner_name: form.to_partner_name || null,
      to_category: form.to_category,
      customer_user_id: form.customer_user_id.trim(),
      reason: form.reason || null,
      urgency: form.urgency,
      notes: form.notes || null,
      documents_requested: form.documents_requested,
      permission_requested: form.permission_requested,
      follow_up_due: form.follow_up_due || null,
      status,
    });
    if (error) return toast.error(error.message);
    toast.success(status === "sent" ? "Referral sent" : "Saved as draft");
    setComposing(false);
    setForm({
      to_partner_name: "",
      to_category: "OB-GYN",
      customer_user_id: "",
      reason: "",
      urgency: "normal",
      notes: "",
      documents_requested: [],
      permission_requested: true,
      follow_up_due: "",
    });
    void load();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("referrals").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rows]);

  return (
    <EdenShell variant={variant} allowedTypes={["provider", "vendor"]}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Referrals</h1>
          <p className="mt-1 font-sans text-sm text-gray-500">
            Refer customers to trusted partners and track the loop end-to-end.
          </p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white"
        >
          + New referral
        </button>
      </div>

      <div className="mt-5 inline-flex rounded-full bg-white p-1 border border-gray-200">
        <button
          onClick={() => setTab("sent")}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium",
            tab === "sent" ? "bg-eve-teal text-white" : "text-gray-600",
          )}
        >
          <Send className="h-3 w-3" /> Sent
        </button>
        <button
          onClick={() => setTab("received")}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium",
            tab === "received" ? "bg-eve-teal text-white" : "text-gray-600",
          )}
        >
          <Inbox className="h-3 w-3" /> Received
        </button>
      </div>

      {composing && (
        <div className="mt-5 rounded-2xl border border-eve-teal/30 bg-white p-5">
          <h2 className="font-sans text-sm font-semibold text-eve-teal-dark">
            Refer a customer
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Customer user ID">
              <input
                value={form.customer_user_id}
                onChange={(e) => setForm({ ...form, customer_user_id: e.target.value })}
                className="input"
                placeholder="Customer's user ID"
              />
            </Field>
            <Field label="Partner category">
              <select
                value={form.to_category}
                onChange={(e) => setForm({ ...form, to_category: e.target.value })}
                className="input"
              >
                {PARTNER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Partner name (optional)" full>
              <input
                value={form.to_partner_name}
                onChange={(e) => setForm({ ...form, to_partner_name: e.target.value })}
                className="input"
                placeholder="Dr. Amina Hassan / Clinique El Andalous"
              />
            </Field>
            <Field label="Reason" full>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="input"
                placeholder="e.g. Suspected PCOS, hormone panel needed"
              />
            </Field>
            <Field label="Urgency">
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="input"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field label="Follow-up due">
              <input
                type="date"
                value={form.follow_up_due}
                onChange={(e) => setForm({ ...form, follow_up_due: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Documents to share" full>
              <div className="flex flex-wrap gap-2">
                {DOC_TYPES.map((d) => {
                  const active = form.documents_requested.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          documents_requested: active
                            ? form.documents_requested.filter((x) => x !== d)
                            : [...form.documents_requested, d],
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        active
                          ? "border-eve-teal bg-eve-teal text-white"
                          : "border-gray-200 text-gray-600",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Notes" full>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input"
                placeholder="What should the receiving partner know?"
              />
            </Field>
            <label className="flex items-center gap-2 text-xs text-gray-700 md:col-span-2">
              <input
                type="checkbox"
                checked={form.permission_requested}
                onChange={(e) =>
                  setForm({ ...form, permission_requested: e.target.checked })
                }
              />
              Request customer permission before sharing documents
            </label>
          </div>
          <div className="mt-4">
            <SafetyDisclaimer />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => send("draft")}
              className="rounded-full border border-eve-teal px-4 py-2 text-sm font-medium text-eve-teal"
            >
              Save draft
            </button>
            <button
              onClick={() => send("sent")}
              className="rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white"
            >
              Send referral
            </button>
            <button
              onClick={() => setComposing(false)}
              className="rounded-full px-4 py-2 text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            No {tab} referrals yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-sans text-sm font-semibold text-gray-900">
                        {r.to_partner_name ?? r.to_category ?? "Partner"}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] capitalize",
                          STATUS_STYLE[r.status] ?? "bg-gray-100",
                        )}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                      {r.urgency === "urgent" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-sans text-xs text-gray-500">
                      {r.to_category} · Customer {r.customer_user_id.slice(0, 8)}…
                    </p>
                    {r.reason && (
                      <p className="mt-1 font-sans text-xs text-gray-700">
                        Reason: {r.reason}
                      </p>
                    )}
                    {r.notes && (
                      <p className="mt-1 font-sans text-xs text-gray-600">{r.notes}</p>
                    )}
                    {r.documents_requested?.length > 0 && (
                      <p className="mt-1 font-sans text-[11px] text-eve-teal">
                        Documents: {r.documents_requested.join(", ")}
                      </p>
                    )}
                    {r.follow_up_due && (
                      <p className="mt-1 font-sans text-[11px] text-gray-500">
                        Follow-up due {r.follow_up_due}
                      </p>
                    )}
                  </div>
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-5 rounded-xl bg-eve-cream px-4 py-3 text-[11px] text-eve-teal-dark">
        Only view or share customer information when the customer has granted permission.
      </p>
      <style>{`.input{width:100%;border:1px solid rgb(229 231 235);background:white;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem}`}</style>
    </EdenShell>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? "block md:col-span-2" : "block"}>
      <span className="mb-1 block font-sans text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
