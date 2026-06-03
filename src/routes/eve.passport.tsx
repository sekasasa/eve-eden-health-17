import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { supabase } from "@/integrations/supabase/client";
import { useSavedProfile } from "@/hooks/useSavedProfile";
import { toast } from "sonner";

export const Route = createFileRoute("/eve/passport")({
  component: PassportPage,
});

type Doc = {
  id: string;
  doc_type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  sensitive: boolean;
  created_at: string;
};

type Share = {
  id: string;
  vendor_id: string;
  scope: Record<string, boolean>;
  revoked_at: string | null;
};

const DOC_TYPES = ["lab", "scan", "rx", "discharge", "insurance", "claim", "care_note"];

function PassportPage() {
  const { profile } = useSavedProfile();
  const [userId, setUserId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [vendors, setVendors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    doc_type: "lab",
    title: "",
    file_url: "",
    notes: "",
    sensitive: false,
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setUserId(auth.user.id);
    const [d, s] = await Promise.all([
      supabase
        .from("care_documents")
        .select("*")
        .eq("customer_user_id", auth.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("passport_shares")
        .select("*")
        .eq("customer_user_id", auth.user.id)
        .is("revoked_at", null),
    ]);
    setDocs((d.data ?? []) as Doc[]);
    setShares((s.data ?? []) as Share[]);
    const vendorIds = Array.from(new Set((s.data ?? []).map((x: { vendor_id: string }) => x.vendor_id)));
    if (vendorIds.length) {
      const { data: vs } = await supabase
        .from("vendors")
        .select("id,business_name")
        .in("id", vendorIds);
      const map: Record<string, string> = {};
      vs?.forEach((v) => (map[v.id] = v.business_name ?? "Partner"));
      setVendors(map);
    }
  }

  async function addDoc() {
    if (!userId) return;
    if (!form.title.trim()) return toast.error("Title required");
    const { error } = await supabase.from("care_documents").insert({
      customer_user_id: userId,
      doc_type: form.doc_type,
      title: form.title.trim(),
      file_url: form.file_url || null,
      notes: form.notes || null,
      sensitive: form.sensitive,
    });
    if (error) return toast.error(error.message);
    toast.success("Document added");
    setAdding(false);
    setForm({ doc_type: "lab", title: "", file_url: "", notes: "", sensitive: false });
    void load();
  }

  async function removeDoc(id: string) {
    const { error } = await supabase.from("care_documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setDocs((d) => d.filter((x) => x.id !== id));
  }

  async function revokeShare(id: string) {
    const { error } = await supabase
      .from("passport_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setShares((ss) => ss.filter((x) => x.id !== id));
    toast.success("Access revoked");
  }

  return (
    <EveShell>
      <Link
        to="/eve/home"
        className="mb-3 inline-flex items-center gap-1 text-xs text-eve-muted"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>
      <h1 className="font-serif text-2xl text-eve-teal-dark">Care Passport</h1>
      <p className="mt-1 font-sans text-sm text-eve-muted">
        A single, private record you control. Share what you choose, with whom you choose.
      </p>

      <div className="mt-5 rounded-2xl bg-white p-4">
        <p className="font-sans text-xs uppercase tracking-wide text-eve-muted">About me</p>
        <p className="mt-2 font-sans text-sm text-eve-teal-dark">
          {[profile.stage, profile.languages?.[0], profile.city, profile.payment]
            .filter(Boolean)
            .join(" · ") || "Complete your profile to personalize your passport."}
        </p>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-sm font-semibold text-eve-teal-dark">
            My documents
          </h2>
          <button
            onClick={() => setAdding(!adding)}
            className="inline-flex items-center gap-1 rounded-full bg-eve-teal px-3 py-1.5 text-xs font-medium text-white"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>

        {adding && (
          <div className="mt-3 rounded-2xl bg-white p-4">
            <div className="grid gap-2">
              <select
                value={form.doc_type}
                onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
                className="input"
              >
                {DOC_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title (e.g. Hormone panel — Aug 2026)"
                className="input"
              />
              <input
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                placeholder="Link to file (optional)"
                className="input"
              />
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes"
                className="input"
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.sensitive}
                  onChange={(e) => setForm({ ...form, sensitive: e.target.checked })}
                />
                Mark sensitive (hidden by default when sharing)
              </label>
              <button
                onClick={addDoc}
                className="rounded-full bg-eve-teal px-4 py-2 text-sm text-white"
              >
                Save document
              </button>
            </div>
          </div>
        )}

        <ul className="mt-3 space-y-2">
          {docs.length === 0 && (
            <li className="rounded-2xl bg-white p-4 text-sm text-eve-muted">
              No documents yet. Add labs, scans, prescriptions, or insurance docs.
            </li>
          )}
          {docs.map((d) => (
            <li key={d.id} className="rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold text-eve-teal-dark">
                    {d.title}
                  </p>
                  <p className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-eve-teal">
                    {d.doc_type}
                    {d.sensitive && (
                      <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700">
                        Sensitive
                      </span>
                    )}
                  </p>
                  {d.notes && (
                    <p className="mt-1 font-sans text-xs text-eve-muted">{d.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeDoc(d.id)}
                  className="text-eve-muted hover:text-red-500"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-sans text-sm font-semibold text-eve-teal-dark">
          Who can see my passport
        </h2>
        <p className="mt-1 font-sans text-xs text-eve-muted inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> You control what each partner sees, and you can
          revoke access anytime.
        </p>
        <ul className="mt-3 space-y-2">
          {shares.length === 0 ? (
            <li className="rounded-2xl bg-white p-4 text-sm text-eve-muted">
              You haven't granted access to anyone yet.
            </li>
          ) : (
            shares.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between rounded-2xl bg-white p-4"
              >
                <div>
                  <p className="font-sans text-sm font-semibold text-eve-teal-dark">
                    {vendors[s.vendor_id] ?? "Partner"}
                  </p>
                  <p className="mt-1 font-sans text-[11px] text-eve-muted">
                    Sharing:{" "}
                    {Object.keys(s.scope || {})
                      .filter((k) => s.scope[k])
                      .join(", ") || "selected items"}
                  </p>
                </div>
                <button
                  onClick={() => revokeShare(s.id)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-eve-muted"
                >
                  Revoke
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="mt-6">
        <SafetyDisclaimer />
      </div>

      <style>{`.input{width:100%;border:1px solid rgb(229 231 235);background:white;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem}`}</style>
    </EveShell>
  );
}
