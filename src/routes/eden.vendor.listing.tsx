import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Check } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/vendor/listing")({
  component: VendorListing,
});

type Vendor = {
  id: string;
  business_name: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  logo_url: string | null;
  is_featured: boolean | null;
  is_verified: boolean | null;
};

const BENEFITS = [
  "Top placement in the Shop & discover feed",
  "Featured badge on your card",
  "Included in weekly WhatsApp shop digests",
  "Priority support from our team",
];

function initials(name: string | null) {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function VendorListing() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data } = await supabase
      .from("vendors")
      .select("id,business_name,description,city,category,logo_url,is_featured,is_verified")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (data) setVendor(data as Vendor);
  }

  function set<K extends keyof Vendor>(k: K, v: Vendor[K]) {
    setVendor((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function save() {
    if (!vendor) return;
    setSaving(true);
    const { error } = await supabase
      .from("vendors")
      .update({
        business_name: vendor.business_name,
        description: vendor.description,
        city: vendor.city,
        logo_url: vendor.logo_url,
      })
      .eq("id", vendor.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Listing updated");
  }

  async function uploadLogo(file: File) {
    if (!vendor) return;
    const ext = file.name.split(".").pop();
    const path = `${vendor.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    set("logo_url", data.publicUrl);
  }

  if (!vendor) {
    return (
      <EdenShell variant="vendor">
        <p className="font-sans text-sm text-gray-500">Loading…</p>
      </EdenShell>
    );
  }

  return (
    <EdenShell variant="vendor">
      <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Listing</h1>
      <p className="mt-1 font-sans text-sm text-gray-500">Your placement and public profile.</p>

      {/* Placement tier */}
      <div className={cn(
        "mt-6 rounded-xl border p-6",
        vendor.is_featured ? "border-eve-teal bg-eve-teal/5" : "border-gray-100 bg-white",
      )}>
        {vendor.is_featured ? (
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-eve-teal p-2 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-sans text-xs uppercase tracking-wide text-eve-teal-dark">Current tier</p>
              <h2 className="mt-1 font-sans text-xl font-semibold text-eve-teal-dark">Featured</h2>
              <p className="mt-1 font-sans text-sm text-gray-600">
                Your listing is boosted in the marketplace. Featured placement is active until end of month.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-sans text-xs uppercase tracking-wide text-gray-500">Current tier</p>
            <h2 className="mt-1 font-sans text-xl font-semibold text-gray-900">Standard</h2>
            <p className="mt-1 font-sans text-sm text-gray-600">Free listing in the marketplace.</p>
            <div className="mt-5 rounded-lg border border-eve-teal/30 bg-eve-teal/5 p-5">
              <p className="font-sans text-sm font-semibold text-eve-teal-dark">Upgrade to Featured</p>
              <ul className="mt-3 space-y-2">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2 font-sans text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-eve-teal" /> {b}
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:team@eveandeden.com?subject=Upgrade ${encodeURIComponent(vendor.business_name ?? "")} to Featured`}
                className="mt-4 inline-block rounded-lg bg-eve-teal px-4 py-2 font-sans text-sm font-medium text-white"
              >
                Talk to our team
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Edit + preview */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h3 className="font-sans text-sm font-semibold text-gray-900">Edit your listing</h3>
          <div className="mt-4 space-y-3">
            <Field label="Business name">
              <input value={vendor.business_name ?? ""} onChange={(e) => set("business_name", e.target.value)} className={inp} />
            </Field>
            <Field label="Description">
              <textarea
                value={vendor.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                className={cn(inp, "min-h-[100px]")}
              />
            </Field>
            <Field label="City">
              <input value={vendor.city ?? ""} onChange={(e) => set("city", e.target.value)} className={inp} />
            </Field>
            <Field label="Logo">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-eve-terra-light font-serif text-eve-terra">
                  {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="h-full w-full object-cover" /> : initials(vendor.business_name)}
                </div>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); }} className="text-xs" />
              </div>
            </Field>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="mt-5 rounded-lg bg-eve-teal px-5 py-2 font-sans text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h3 className="font-sans text-sm font-semibold text-gray-900">Marketplace preview</h3>
          <p className="mt-0.5 font-sans text-xs text-gray-500">How mothers see your card in /eve/vendors</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-eve-cream p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-eve-terra-light font-serif text-base text-eve-terra">
              {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="h-full w-full object-cover" /> : initials(vendor.business_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-sm font-medium text-eve-forest">{vendor.business_name ?? "—"}</div>
              <div className="truncate font-sans text-[11px] text-eve-muted">
                {vendor.category ?? "—"} {vendor.city ? `· ${vendor.city}` : ""}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <TrustBadge />
                {vendor.is_featured && (
                  <span className="rounded-full bg-eve-teal px-2 py-0.5 font-sans text-[9px] font-medium text-white">Featured</span>
                )}
              </div>
            </div>
          </div>
          {vendor.description && (
            <p className="mt-4 font-sans text-sm text-gray-600">{vendor.description}</p>
          )}
        </div>
      </div>
    </EdenShell>
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
