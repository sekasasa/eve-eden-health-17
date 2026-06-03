import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus, Star } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/partners")({
  component: PartnersPage,
});

type Partner = {
  id: string;
  partner_name: string;
  category: string;
  location: string | null;
  languages: string[];
  payment_options: string[];
  recommendation_note: string | null;
  verified: boolean;
};

const CATEGORIES = [
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

function PartnersPage() {
  const [variant, setVariant] = useState<"provider" | "vendor">("vendor");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [rows, setRows] = useState<Partner[]>([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    partner_name: "",
    category: "OB-GYN",
    location: "",
    languages: "",
    payment_options: "",
    recommendation_note: "",
    verified: false,
  });

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
      .from("trusted_partners")
      .select("*")
      .eq("owner_vendor_id", v.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Partner[]);
    setLoading(false);
  }

  async function add() {
    if (!vendorId) return;
    if (!form.partner_name.trim()) return toast.error("Partner name required");
    const { error } = await supabase.from("trusted_partners").insert({
      owner_vendor_id: vendorId,
      partner_name: form.partner_name.trim(),
      category: form.category,
      location: form.location || null,
      languages: form.languages
        ? form.languages.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      payment_options: form.payment_options
        ? form.payment_options.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      recommendation_note: form.recommendation_note || null,
      verified: form.verified,
    });
    if (error) return toast.error(error.message);
    toast.success("Partner added");
    setAdding(false);
    setForm({
      partner_name: "",
      category: "OB-GYN",
      location: "",
      languages: "",
      payment_options: "",
      recommendation_note: "",
      verified: false,
    });
    void load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("trusted_partners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  return (
    <EdenShell variant={variant} allowedTypes={["provider", "vendor"]}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">
            My trusted partners
          </h1>
          <p className="mt-1 font-sans text-sm text-gray-500">
            Curate the providers, labs, pharmacies, and vendors you trust most.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Add partner
        </button>
      </div>

      {adding && (
        <div className="mt-5 rounded-2xl border border-eve-teal/30 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Partner name" full>
              <input
                value={form.partner_name}
                onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                className="input"
                placeholder="Dr. Amina Hassan"
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input"
                placeholder="Casablanca"
              />
            </Field>
            <Field label="Languages (comma separated)">
              <input
                value={form.languages}
                onChange={(e) => setForm({ ...form, languages: e.target.value })}
                className="input"
                placeholder="French, Arabic"
              />
            </Field>
            <Field label="Payment options (comma separated)">
              <input
                value={form.payment_options}
                onChange={(e) => setForm({ ...form, payment_options: e.target.value })}
                className="input"
                placeholder="Cash, CNSS, Card"
              />
            </Field>
            <Field label="Why I recommend them" full>
              <textarea
                rows={2}
                value={form.recommendation_note}
                onChange={(e) =>
                  setForm({ ...form, recommendation_note: e.target.value })
                }
                className="input"
                placeholder="Compassionate, multilingual, accepts CNSS, …"
              />
            </Field>
            <label className="flex items-center gap-2 text-xs text-gray-700 md:col-span-2">
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(e) => setForm({ ...form, verified: e.target.checked })}
              />
              I have personally verified this partner
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={add}
              className="rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white"
            >
              Add partner
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-full px-4 py-2 text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
          <style>{`.input{width:100%;border:1px solid rgb(229 231 235);background:white;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem}`}</style>
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 md:col-span-2 lg:col-span-3">
            No trusted partners yet. Add the OB-GYNs, labs, pharmacies, and shops you regularly refer to.
          </p>
        ) : (
          rows.map((p) => (
            <div key={p.id} className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-sans text-sm font-semibold text-gray-900">
                    {p.partner_name}
                  </p>
                  <p className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-eve-teal">
                    {p.category}
                  </p>
                </div>
                {p.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              {p.location && (
                <p className="mt-2 font-sans text-xs text-gray-600">{p.location}</p>
              )}
              {p.languages?.length > 0 && (
                <p className="mt-1 font-sans text-[11px] text-gray-500">
                  Languages: {p.languages.join(", ")}
                </p>
              )}
              {p.payment_options?.length > 0 && (
                <p className="mt-1 font-sans text-[11px] text-gray-500">
                  Payment: {p.payment_options.join(", ")}
                </p>
              )}
              {p.recommendation_note && (
                <p className="mt-2 rounded-lg bg-eve-cream px-3 py-2 font-sans text-xs text-eve-teal-dark">
                  <Star className="mr-1 inline h-3 w-3" /> {p.recommendation_note}
                </p>
              )}
              <div className="mt-3 flex justify-between">
                <button className="text-xs font-medium text-eve-teal">Refer →</button>
                <button
                  onClick={() => remove(p.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
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
