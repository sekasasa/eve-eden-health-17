import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTENT_TYPES,
  CONTENT_CATEGORIES,
  CTA_OPTIONS,
  CLINICAL_CATEGORIES,
} from "@/lib/content-filter";
import { toast } from "sonner";

type Search = { type?: string };

export const Route = createFileRoute("/eden/vendor/content/new")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    type: typeof s.type === "string" ? s.type : "article",
  }),
  component: NewContent,
});

function NewContent() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content_type: search.type ?? "article",
    category: "wellness",
    life_stage: "",
    related_service: "",
    language: "en",
    location: "",
    tags: "",
    media_url: "",
    excerpt: "",
    body: "",
    cta_type: "profile",
    cta_url: "",
    event_at: "",
  });

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: v } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (v) setVendorId(v.id);
    })();
  }, []);

  const isClinical = CLINICAL_CATEGORIES.has(form.category);

  async function save(status: "draft" | "submitted" | "published") {
    if (!vendorId) return toast.error("Vendor profile required");
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    const finalStatus = status === "published" && isClinical ? "submitted" : status;
    const { data, error } = await supabase
      .from("vendor_content")
      .insert({
        vendor_id: vendorId,
        title: form.title.trim(),
        excerpt: form.excerpt || null,
        body: form.body || null,
        content_type: form.content_type,
        category: form.category,
        life_stage: form.life_stage || null,
        related_service: form.related_service || null,
        language: form.language,
        location: form.location || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        media_url: form.media_url || null,
        cta_type: form.cta_type || null,
        cta_url: form.cta_url || null,
        event_at: form.event_at || null,
        status: finalStatus,
        requires_review: isClinical,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (finalStatus === "submitted") {
      toast.success("Submitted for Eve & Eden review");
    } else if (finalStatus === "published") {
      toast.success("Published");
    } else {
      toast.success("Saved as draft");
    }
    nav({ to: "/eden/vendor/content/$id/edit", params: { id: data.id } });
  }

  return (
    <EdenShell variant="vendor" allowedTypes={["provider", "vendor"]}>
      <button
        onClick={() => nav({ to: "/eden/vendor/content" })}
        className="mb-3 inline-flex items-center gap-1 text-xs text-gray-500"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Content Studio
      </button>
      <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">New content</h1>
      <p className="mt-1 font-sans text-sm text-gray-500">
        Helpful first, promotional second. Educate your audience.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Type">
          <select
            value={form.content_type}
            onChange={(e) => setForm({ ...form, content_type: e.target.value })}
            className="input"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="input"
          >
            {CONTENT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title" full>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            placeholder="e.g. What to ask before your first IVF consultation"
          />
        </Field>
        <Field label="Life stage (optional)">
          <select
            value={form.life_stage}
            onChange={(e) => setForm({ ...form, life_stage: e.target.value })}
            className="input"
          >
            <option value="">—</option>
            {["ttc", "ivf", "pregnant", "postpartum", "newborn", "pcos", "mood", "labs", "rx", "insurance", "wellness", "family"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Language">
          <select
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className="input"
          >
            {["en", "fr", "ar", "es"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="input"
            placeholder="e.g. Casablanca"
          />
        </Field>
        <Field label="Related service">
          <input
            value={form.related_service}
            onChange={(e) => setForm({ ...form, related_service: e.target.value })}
            className="input"
            placeholder="e.g. IVF consultation"
          />
        </Field>
        <Field label="Tags (comma separated)" full>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="input"
            placeholder="fertility, ivf, preparation"
          />
        </Field>
        <Field label="Media URL (image or video)" full>
          <input
            value={form.media_url}
            onChange={(e) => setForm({ ...form, media_url: e.target.value })}
            className="input"
            placeholder="https://..."
          />
        </Field>
        <Field label="Excerpt" full>
          <input
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            className="input"
            placeholder="Short preview shown on cards"
          />
        </Field>
        <Field label="Body" full>
          <textarea
            rows={8}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="input"
            placeholder="Write your article, tip, or description…"
          />
        </Field>
        <Field label="Call-to-action">
          <select
            value={form.cta_type}
            onChange={(e) => setForm({ ...form, cta_type: e.target.value })}
            className="input"
          >
            {CTA_OPTIONS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="CTA link">
          <input
            value={form.cta_url}
            onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
            className="input"
            placeholder="https://…"
          />
        </Field>
        {form.content_type === "event" && (
          <Field label="Event date/time">
            <input
              type="datetime-local"
              value={form.event_at}
              onChange={(e) => setForm({ ...form, event_at: e.target.value })}
              className="input"
            />
          </Field>
        )}
      </div>

      {isClinical && (
        <div className="mt-5 space-y-2">
          <SafetyDisclaimer />
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            Health-related content requires Eve & Eden review before publishing. Use "Submit for review".
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          disabled={saving}
          onClick={() => save("draft")}
          className="rounded-full border border-eve-teal px-4 py-2 text-sm font-medium text-eve-teal"
        >
          Save as draft
        </button>
        <button
          disabled={saving}
          onClick={() => save(isClinical ? "submitted" : "published")}
          className="rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white"
        >
          {isClinical ? "Submit for review" : "Publish"}
        </button>
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
