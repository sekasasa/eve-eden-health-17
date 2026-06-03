import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Users, Share2, Handshake, FileText, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Counts = {
  leadsNew: number;
  leadsContacted: number;
  leadsBooked: number;
  referralsSent: number;
  referralsReceived: number;
  referralsFollowUp: number;
  partners: number;
  sharedDocs: number;
  sharedDocsUnreviewed: number;
};

const ZERO: Counts = {
  leadsNew: 0,
  leadsContacted: 0,
  leadsBooked: 0,
  referralsSent: 0,
  referralsReceived: 0,
  referralsFollowUp: 0,
  partners: 0,
  sharedDocs: 0,
  sharedDocsUnreviewed: 0,
};

export function CoordinationPanels() {
  const [c, setC] = useState<Counts>(ZERO);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
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

      const [leads, refSent, refRecv, partners, shares] = await Promise.all([
        supabase.from("leads").select("status").eq("vendor_id", v.id),
        supabase.from("referrals").select("status").eq("from_vendor_id", v.id),
        supabase.from("referrals").select("status").eq("to_vendor_id", v.id),
        supabase
          .from("trusted_partners")
          .select("id", { count: "exact", head: true })
          .eq("owner_vendor_id", v.id),
        supabase
          .from("document_shares")
          .select("id,reviewed_at,revoked_at")
          .eq("vendor_id", v.id)
          .is("revoked_at", null),
      ]);

      const leadRows = leads.data ?? [];
      const sentRows = refSent.data ?? [];
      const recvRows = refRecv.data ?? [];
      const shareRows = shares.data ?? [];

      setC({
        leadsNew: leadRows.filter((l: any) => l.status === "new").length,
        leadsContacted: leadRows.filter((l: any) => l.status === "contacted").length,
        leadsBooked: leadRows.filter((l: any) => l.status === "booked").length,
        referralsSent: sentRows.length,
        referralsReceived: recvRows.length,
        referralsFollowUp: [...sentRows, ...recvRows].filter(
          (r: any) => r.status === "follow_up" || r.status === "appt_requested",
        ).length,
        partners: partners.count ?? 0,
        sharedDocs: shareRows.length,
        sharedDocsUnreviewed: shareRows.filter((s: any) => !s.reviewed_at).length,
      });
      setLoading(false);
    })();
  }, []);

  if (!loading && !vendorId) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-base font-medium text-gray-900">
          Coordination &amp; referrals
        </h2>
        <span className="font-sans text-[11px] text-gray-500">
          Customers control what they share with you.
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PanelCard
          to="/eden/leads"
          icon={Users}
          title="New leads"
          tone="teal"
          loading={loading}
          metric={c.leadsNew}
          metricLabel="new"
          subline={`${c.leadsContacted} contacted · ${c.leadsBooked} booked`}
          actions={["View new", "Mark contacted", "Refer", "Message"]}
        />
        <PanelCard
          to="/eden/referrals"
          icon={Share2}
          title="Referrals"
          tone="violet"
          loading={loading}
          metric={c.referralsSent + c.referralsReceived}
          metricLabel="active"
          subline={`${c.referralsSent} sent · ${c.referralsReceived} received · ${c.referralsFollowUp} need follow-up`}
          actions={["Compose", "Accept", "Request appointment", "Mark completed"]}
        />
        <PanelCard
          to="/eden/partners"
          icon={Handshake}
          title="My trusted partners"
          tone="amber"
          loading={loading}
          metric={c.partners}
          metricLabel="saved"
          subline="OB-GYNs, IVF, labs, pharmacies, doulas, pediatricians, shops"
          actions={["Add partner", "Refer to", "Edit note"]}
        />
        <PanelCard
          to="/eden/shared-docs"
          icon={FileText}
          title="Shared care documents"
          tone="rose"
          loading={loading}
          metric={c.sharedDocsUnreviewed}
          metricLabel="to review"
          subline={`${c.sharedDocs} active shares · customer-controlled`}
          actions={["View", "Mark reviewed", "Add follow-up", "Refer"]}
        />
      </div>
    </section>
  );
}

const TONE: Record<string, { bg: string; fg: string; chip: string }> = {
  teal: { bg: "bg-eve-teal-light/40", fg: "text-eve-teal-dark", chip: "bg-eve-teal text-white" },
  violet: { bg: "bg-violet-50", fg: "text-violet-900", chip: "bg-violet-600 text-white" },
  amber: { bg: "bg-amber-50", fg: "text-amber-900", chip: "bg-amber-500 text-white" },
  rose: { bg: "bg-rose-50", fg: "text-rose-900", chip: "bg-rose-500 text-white" },
};

function PanelCard({
  to,
  icon: Icon,
  title,
  tone,
  loading,
  metric,
  metricLabel,
  subline,
  actions,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  tone: keyof typeof TONE;
  loading: boolean;
  metric: number;
  metricLabel: string;
  subline: string;
  actions: string[];
}) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", t.chip)}>
          <Icon className="h-4 w-4" />
        </div>
        <p className={cn("font-sans text-sm font-semibold", t.fg)}>{title}</p>
      </div>
      <div className="mt-4 flex items-end gap-2">
        {loading ? (
          <div className="h-8 w-12 animate-pulse rounded bg-gray-100" />
        ) : (
          <span className="font-sans text-3xl font-bold leading-none text-gray-900">{metric}</span>
        )}
        <span className="pb-1 font-sans text-xs text-gray-500">{metricLabel}</span>
      </div>
      <p className="mt-2 font-sans text-xs text-gray-500">{subline}</p>
      <div className={cn("mt-4 rounded-lg px-3 py-2 font-sans text-[11px]", t.bg, t.fg)}>
        {actions.join(" · ")}
      </div>
      <span className="mt-3 font-sans text-xs font-medium text-eve-teal group-hover:underline">
        Open →
      </span>
    </Link>
  );
}
