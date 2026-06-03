import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/eve/referrals")({
  component: ReferralsPage,
});

type Referral = {
  id: string;
  from_vendor_id: string;
  to_vendor_id: string | null;
  to_partner_name: string | null;
  to_category: string | null;
  reason: string | null;
  urgency: string;
  notes: string | null;
  documents_requested: string[];
  status: string;
  follow_up_due: string | null;
  created_at: string;
  customer_consent_share_completion: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "New",
  viewed: "Viewed",
  accepted: "Accepted",
  appt_requested: "Appointment requested",
  appt_confirmed: "Appointment confirmed",
  checked_in: "Checked in",
  completed: "Completed",
  follow_up: "Follow-up needed",
  closed: "Closed",
  declined: "Declined",
};

function ReferralsPage() {
  const [rows, setRows] = useState<Referral[]>([]);
  const [from, setFrom] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data } = await supabase
      .from("referrals")
      .select("*")
      .eq("customer_user_id", auth.user.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Referral[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.from_vendor_id)));
    if (ids.length) {
      const { data: vs } = await supabase
        .from("vendors")
        .select("id,business_name")
        .in("id", ids);
      const map: Record<string, string> = {};
      vs?.forEach((v) => (map[v.id] = v.business_name ?? "Your provider"));
      setFrom(map);
    }
    setLoading(false);

    // Mark as viewed
    const unseen = list.filter((r) => r.status === "sent").map((r) => r.id);
    if (unseen.length) {
      await supabase
        .from("referrals")
        .update({ status: "viewed" })
        .in("id", unseen);
    }
  }

  async function setStatus(id: string, status: string, extra?: Partial<Referral>) {
    const { error } = await supabase
      .from("referrals")
      .update({ status, ...extra })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status, ...(extra ?? {}) } : r)));
    toast.success("Updated");
  }

  return (
    <EveShell>
      <Link
        to="/eve/home"
        className="mb-3 inline-flex items-center gap-1 text-xs text-eve-muted"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>
      <h1 className="font-serif text-2xl text-eve-teal-dark">Recommended next steps</h1>
      <p className="mt-1 font-sans text-sm text-eve-muted">
        Trusted referrals from your providers — accept, book, or save for later.
      </p>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-eve-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-sm text-eve-muted">
            No referrals yet. When a provider recommends a next step, it will appear here.
          </p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="rounded-2xl bg-white p-5">
              <p className="font-sans text-[11px] uppercase tracking-wide text-eve-teal">
                From {from[r.from_vendor_id] ?? "your provider"}
              </p>
              <h2 className="mt-1 font-serif text-lg text-eve-teal-dark">
                {r.to_partner_name ?? r.to_category ?? "Recommended partner"}
              </h2>
              <p className="mt-1 font-sans text-xs text-eve-muted">{r.to_category}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    r.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-eve-cream text-eve-teal-dark",
                  )}
                >
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
                {r.urgency === "urgent" && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700">
                    Urgent
                  </span>
                )}
              </div>

              {r.reason && (
                <p className="mt-3 font-sans text-sm text-eve-teal-dark">
                  <strong>Why:</strong> {r.reason}
                </p>
              )}
              {r.notes && (
                <p className="mt-2 font-sans text-xs text-eve-muted">{r.notes}</p>
              )}
              {r.documents_requested?.length > 0 && (
                <p className="mt-2 font-sans text-[11px] text-eve-teal">
                  What to bring: {r.documents_requested.join(", ")}
                </p>
              )}
              {r.follow_up_due && (
                <p className="mt-2 font-sans text-[11px] text-eve-muted">
                  Suggested by {r.follow_up_due}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setStatus(r.id, "accepted")}
                  className="rounded-full bg-eve-teal px-4 py-1.5 text-xs font-medium text-white"
                >
                  Accept
                </button>
                <button
                  onClick={() => setStatus(r.id, "appt_requested")}
                  className="rounded-full border border-eve-teal px-4 py-1.5 text-xs font-medium text-eve-teal"
                >
                  Request appointment
                </button>
                <button
                  onClick={() => setStatus(r.id, "completed", { customer_consent_share_completion: true })}
                  className="rounded-full border border-gray-200 px-4 py-1.5 text-xs text-gray-700"
                >
                  I attended
                </button>
                <button
                  onClick={() => setStatus(r.id, "declined")}
                  className="rounded-full px-4 py-1.5 text-xs text-eve-muted"
                >
                  Decline
                </button>
                <Link
                  to="/eve/ask"
                  className="inline-flex items-center gap-1 rounded-full bg-eve-cream px-4 py-1.5 text-xs text-eve-teal-dark"
                >
                  <Sparkles className="h-3 w-3" /> Ask navigator
                </Link>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-6">
        <SafetyDisclaimer />
      </div>
    </EveShell>
  );
}
