import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, ShieldCheck } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/shared-docs")({
  component: SharedDocsPage,
});

type Share = {
  id: string;
  document_id: string;
  customer_user_id: string;
  granted_at: string;
  revoked_at: string | null;
  reviewed_at: string | null;
  follow_up_note: string | null;
  document?: {
    title: string;
    doc_type: string;
    file_url: string | null;
    notes: string | null;
    sensitive: boolean;
  } | null;
};

function SharedDocsPage() {
  const [variant, setVariant] = useState<"provider" | "vendor">("vendor");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [rows, setRows] = useState<Share[]>([]);
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
      .from("document_shares")
      .select("*, document:care_documents(title,doc_type,file_url,notes,sensitive)")
      .eq("vendor_id", v.id)
      .is("revoked_at", null)
      .order("granted_at", { ascending: false });
    setRows((data ?? []) as Share[]);
    setLoading(false);
  }

  async function markReviewed(id: string) {
    const { error } = await supabase
      .from("document_shares")
      .update({ reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, reviewed_at: new Date().toISOString() } : r)),
    );
  }

  async function addFollowUp(id: string) {
    const note = window.prompt("Follow-up recommendation for this document:");
    if (!note) return;
    const { error } = await supabase
      .from("document_shares")
      .update({ follow_up_note: note })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, follow_up_note: note } : r)));
    toast.success("Follow-up added");
  }

  return (
    <EdenShell variant={variant} allowedTypes={["provider", "vendor"]}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">
            Shared care documents
          </h1>
          <p className="mt-1 font-sans text-sm text-gray-500">
            Documents customers have shared with you.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-eve-teal-light text-eve-teal">
          <FileText className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-eve-cream px-3 py-2 text-[11px] text-eve-teal-dark">
        <ShieldCheck className="h-3 w-3" /> The customer controls what information is shared.
      </p>

      <div className="mt-5">
        <SafetyDisclaimer />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : !vendorId ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Complete your vendor onboarding first.
          </p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            No customer has shared documents with you yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((s) => (
              <li key={s.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-semibold text-gray-900">
                      {s.document?.title ?? "Untitled document"}
                    </p>
                    <p className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-eve-teal">
                      {s.document?.doc_type ?? "document"}
                      {s.document?.sensitive && (
                        <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700">
                          Sensitive
                        </span>
                      )}
                    </p>
                    <p className="mt-1 font-sans text-xs text-gray-500">
                      Customer {s.customer_user_id.slice(0, 8)}… ·
                      Shared {new Date(s.granted_at).toLocaleDateString()}
                      {s.reviewed_at && (
                        <> · Reviewed {new Date(s.reviewed_at).toLocaleDateString()}</>
                      )}
                    </p>
                    {s.document?.notes && (
                      <p className="mt-2 font-sans text-xs text-gray-700">
                        {s.document.notes}
                      </p>
                    )}
                    {s.follow_up_note && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 font-sans text-xs text-amber-800">
                        Follow-up: {s.follow_up_note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {s.document?.file_url && (
                      <a
                        href={s.document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-eve-teal px-3 py-1 text-xs text-eve-teal"
                      >
                        View
                      </a>
                    )}
                    {!s.reviewed_at && (
                      <button
                        onClick={() => markReviewed(s.id)}
                        className="rounded-full bg-eve-teal px-3 py-1 text-xs text-white"
                      >
                        Mark reviewed
                      </button>
                    )}
                    <button
                      onClick={() => addFollowUp(s.id)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700"
                    >
                      Add follow-up
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </EdenShell>
  );
}
