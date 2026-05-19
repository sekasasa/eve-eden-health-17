import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2, Plus } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/vendor/products")({
  component: VendorProducts,
});

type Product = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price_mad: number | null;
  category: string | null;
  image_url: string | null;
  pregnancy_week_min: number | null;
  pregnancy_week_max: number | null;
  is_available: boolean | null;
  stock_count: number | null;
};

const CATEGORIES = ["Maternity wear", "Baby gear", "Nutrition", "Pharmacy", "Classes"];

function emptyDraft(vendorId: string): Product {
  return {
    id: "",
    vendor_id: vendorId,
    name: "",
    description: "",
    price_mad: 0,
    category: CATEGORIES[0],
    image_url: null,
    pregnancy_week_min: 1,
    pregnancy_week_max: 40,
    is_available: true,
    stock_count: 0,
  };
}

function VendorProducts() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: v } = await supabase.from("vendors").select("id").eq("user_id", auth.user.id).maybeSingle();
    if (!v) return;
    setVendorId(v.id);
    const { data } = await supabase.from("products").select("*").eq("vendor_id", v.id).order("created_at", { ascending: false });
    setProducts((data ?? []) as Product[]);
  }

  async function toggleAvailable(p: Product) {
    const next = !p.is_available;
    await supabase.from("products").update({ is_available: next }).eq("id", p.id);
    setProducts((rows) => rows.map((r) => (r.id === p.id ? { ...r, is_available: next } : r)));
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((rows) => rows.filter((r) => r.id !== id));
    toast.success("Deleted");
  }

  return (
    <EdenShell variant="vendor">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">My products</h1>
        <PrimaryButton onClick={() => vendorId && setEditing(emptyDraft(vendorId))} className="px-4 py-2 text-sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add product
        </PrimaryButton>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Weeks</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No products yet.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-900">{Number(p.price_mad ?? 0).toFixed(0)} MAD</td>
                <td className="px-4 py-3 text-gray-600">{p.pregnancy_week_min ?? 1}–{p.pregnancy_week_max ?? 40}</td>
                <td className="px-4 py-3 text-gray-600">{p.stock_count ?? 0}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailable(p)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      p.is_available ? "bg-eve-teal" : "bg-gray-300",
                    )}
                  >
                    <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", p.is_available ? "left-4" : "left-0.5")} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(p)} className="mr-2 rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setProducts((rows) => {
              const exists = rows.find((r) => r.id === saved.id);
              return exists ? rows.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...rows];
            });
            setEditing(null);
          }}
        />
      )}
    </EdenShell>
  );
}

function ProductModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: (p: Product) => void }) {
  const [draft, setDraft] = useState<Product>(product);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof Product>(k: K, v: Product[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function upload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${draft.vendor_id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      set("image_url", data.publicUrl);
    }
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    const payload = {
      vendor_id: draft.vendor_id,
      name: draft.name,
      description: draft.description,
      price_mad: draft.price_mad,
      category: draft.category,
      image_url: draft.image_url,
      pregnancy_week_min: draft.pregnancy_week_min,
      pregnancy_week_max: draft.pregnancy_week_max,
      is_available: draft.is_available,
      stock_count: draft.stock_count,
    };
    const { data, error } = draft.id
      ? await supabase.from("products").update(payload).eq("id", draft.id).select().single()
      : await supabase.from("products").insert(payload).select().single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    onSaved(data as Product);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-sans text-lg font-semibold text-gray-900">{draft.id ? "Edit product" : "Add product"}</h2>

        <div className="mt-4 space-y-3">
          <Field label="Name">
            <input value={draft.name} onChange={(e) => set("name", e.target.value)} className={inp} />
          </Field>
          <Field label="Description (max 200)">
            <textarea
              value={draft.description ?? ""}
              maxLength={200}
              onChange={(e) => set("description", e.target.value)}
              className={cn(inp, "min-h-[80px]")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (MAD)">
              <input
                type="number"
                min={0}
                value={draft.price_mad ?? 0}
                onChange={(e) => set("price_mad", Number(e.target.value))}
                className={inp}
              />
            </Field>
            <Field label="Stock count">
              <input
                type="number"
                min={0}
                value={draft.stock_count ?? 0}
                onChange={(e) => set("stock_count", Number(e.target.value))}
                className={inp}
              />
            </Field>
          </div>
          <Field label="Category">
            <select value={draft.category ?? ""} onChange={(e) => set("category", e.target.value)} className={inp}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={`Relevant pregnancy weeks: ${draft.pregnancy_week_min}–${draft.pregnancy_week_max}`}>
            <div className="flex items-center gap-3">
              <input
                type="range" min={1} max={40}
                value={draft.pregnancy_week_min ?? 1}
                onChange={(e) => set("pregnancy_week_min", Math.min(Number(e.target.value), draft.pregnancy_week_max ?? 40))}
                className="flex-1 accent-eve-teal"
              />
              <input
                type="range" min={1} max={40}
                value={draft.pregnancy_week_max ?? 40}
                onChange={(e) => set("pregnancy_week_max", Math.max(Number(e.target.value), draft.pregnancy_week_min ?? 1))}
                className="flex-1 accent-eve-teal"
              />
            </div>
          </Field>
          <Field label="Image">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-md bg-gray-100">
                {draft.image_url && <img src={draft.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
                className="font-sans text-xs"
              />
              {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
            </div>
          </Field>
          <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <span className="font-sans text-sm">Available for purchase</span>
            <input
              type="checkbox"
              checked={!!draft.is_available}
              onChange={(e) => set("is_available", e.target.checked)}
              className="h-4 w-4 accent-eve-teal"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm">Cancel</button>
          <button
            onClick={save}
            disabled={saving || !draft.name}
            className="rounded-lg bg-eve-teal px-4 py-2 font-sans text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm focus:border-eve-teal focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-sans text-[11px] uppercase tracking-wide text-gray-500">{label}</label>
      {children}
    </div>
  );
}
