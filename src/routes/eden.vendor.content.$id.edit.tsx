import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTENT_TYPES,
  CONTENT_CATEGORIES,
  CTA_OPTIONS,
  CLINICAL_CATEGORIES,
  type ContentRow,
} from "@/lib/content-filter";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/vendor/content/$id/edit")({
  component: EditContent,
});

function EditContent() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [row, setRow] = useState<ContentRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vendor_content")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setRow(data as ContentRow | null);
    })();
  }, [id]);

  if (!row) {
    return (
      <EdenShell variant="vendor" allowedTypes={["provider", "vendor"]}>
        <p className="text-sm text-gray-500">Loading…</p>
      </EdenShell>
    );
  }

  const isClinical = row.category ? CLINICAL_CATEGORIES.has(row.category) : false;

  async function save(status?: string) {
    if (!row) return;
    setSaving(true);
    const payload: Partial<ContentRow> & { requires_review: boolean } = {
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      content_type: row.content_type,
      category: row.category,
      life_stage: row.life_stage,
      language: row.language,
      location: row.location,
      tags: row.tags,
      media_url: row.media_url,
      cta_type: row.cta_type,
      cta_url: row.cta_url,
      event_at: row.event_at,
      requires_review: isClinical,
    };
    if (status) {
      payload.status = status === "published" && isClinical ? "submitted" : status;
    }
    const { error } = await supabase
      .from("vendor_content")
      .update(payload)
      .eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    if (status) setRow({ ...row, status: payload.status as string });
  }

  async function del() {
    if (!confirm("Delete this post?")) return;
    await supabase.from("vendor_content").delete().eq("id", row!.id);
    nav({ to: "/eden/vendor/content" });
  }

  return (
    <EdenShell variant="vendor" allowedTypes={["provider", "vendor"]}>
      <button
        onClick={() => nav({ to: "/eden/vendor/content" })}
        className="mb-3 inline-flex items-center gap-1 text-xs text-gray-500"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </button>
      <div className="flex items-start justify-between">
        <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Edit content</h1>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] capitalize text-gray-700">
          {row.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Type">
          <select value={row.content_type} onChange={(e) => setRow({ ...row, content_type: e.target.value })} className="input">
            {CONTENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select value={row.category ?? ""} onChange={(e) => setRow({ ...row, category: e.target.value })} className="input">
            {CONTENT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Title" full>
          <input value={row.title} onChange={(e) => setRow({ ...row, title: e.target.value })} className="input" />
        </Field>
        <Field label="Excerpt" full>
          <input value={row.excerpt ?? ""} onChange={(e) => setRow({ ...row, excerpt: e.target.value })} className="input" />
        </Field>
        <Field label="Body" full>
          <textarea rows={8} value={row.body ?? ""} onChange={(e) => setRow({ ...row, body: e.target.value })} className="input" />
        </Field>
        <Field label="Media URL" full>
          <input value={row.media_url ?? ""} onChange={(e) => setRow({ ...row, media_url: e.target.value })} className="input" />
        </Field>
        <Field label="CTA">
          <select value={row.cta_type ?? ""} onChange={(e) => setRow({ ...row, cta_type: e.target.value })} className="input">
            {CTA_OPTIONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="CTA URL">
          <input value={row.cta_url ?? ""} onChange={(e) => setRow({ ...row, cta_url: e.target.value })} className="input" />
        </Field>
      </div>

      {isClinical && <div className="mt-4"><SafetyDisclaimer /></div>}

      <div className="mt-6 flex flex-wrap gap-2">
        <button disabled={saving} onClick={() => save()} className="rounded-full border border-eve-teal px-4 py-2 text-sm font-medium text-eve-teal">Save changes</button>
        <button disabled={saving} onClick={() => save("draft")} className="rounded-full border border-gray-200 px-4 py-2 text-sm">Move to draft</button>
        <button disabled={saving} onClick={() => save("published")} className="rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white">
          {isClinical ? "Submit for review" : "Publish"}
        </button>
        <button disabled={saving} onClick={() => save("archived")} className="rounded-full border border-gray-200 px-4 py-2 text-sm">Archive</button>
        <button onClick={del} className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-200 px-4 py-2 text-sm text-red-600">
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-gray-100 bg-white p-5">
        <h2 className="font-sans text-sm font-semibold text-gray-900">Performance</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-4">
          <Stat label="Views" value={row.views} />
          <Stat label="Saves" value={row.saves} />
          <Stat label="Profile visits" value={(row as ContentRow & { profile_visits?: number }).profile_visits ?? 0} />
          <Stat label="Booking clicks" value={(row as ContentRow & { booking_clicks?: number }).booking_clicks ?? 0} />
        </div>
      </div>
      <style>{`.input{width:100%;border:1px solid rgb(229 231 235);background:white;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem}`}</style>
    </EdenShell>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "block md:col-span-2" : "block"}>
      <span className="mb-1 block font-sans text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="font-sans text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 font-sans text-xl font-semibold text-eve-teal-dark">{value}</p>
    </div>
  );
}
