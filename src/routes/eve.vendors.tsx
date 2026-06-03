import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Store } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { EveCard } from "@/components/ui/EveCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSavedProfile } from "@/hooks/useSavedProfile";
import type { LifeStage } from "@/lib/match-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/vendors")({
  component: EveVendors,
});

const CATEGORIES = [
  "All",
  "Maternity wear",
  "Baby gear",
  "Nutrition",
  "Pharmacy",
  "Classes",
] as const;

type Vendor = {
  id: string;
  business_name: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  description: string | null;
};

function initials(name: string | null) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function EveVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [country, setCountry] = useState<string>("MA");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        const { data: m } = await supabase
          .from("mothers")
          .select("country")
          .eq("user_id", userId)
          .maybeSingle();
        if (m?.country) setCountry(m.country);
      }

      const { data } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_verified", true);

      const vs = (data ?? []) as Vendor[];
      setVendors(vs);

      const ids = vs.map((v) => v.id);
      if (ids.length) {
        const { data: prods } = await supabase
          .from("products")
          .select("vendor_id")
          .in("vendor_id", ids)
          .eq("is_available", true);
        const counts: Record<string, number> = {};
        (prods ?? []).forEach((p: { vendor_id: string }) => {
          counts[p.vendor_id] = (counts[p.vendor_id] ?? 0) + 1;
        });
        setProductCounts(counts);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return vendors
      .filter((v) => (v.country ?? "MA") === country)
      .filter((v) => (cat === "All" ? true : v.category === cat));
  }, [vendors, country, cat]);

  const featured = useMemo(() => vendors.filter((v) => v.is_featured), [vendors]);

  return (
    <EveShell>
      <header className="pt-2">
        <h1 className="font-serif text-2xl text-eve-forest">Shop &amp; discover</h1>
        <p className="mt-1 font-sans text-sm text-eve-muted">
          Vetted products and services for your pregnancy
        </p>
      </header>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mt-6">
          <SectionLabel>Featured</SectionLabel>
          <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
            {featured.map((v) => (
              <Link
                key={v.id}
                to="/eve/vendors/$id"
                params={{ id: v.id }}
                className="flex h-[140px] w-[120px] shrink-0 flex-col items-center justify-between rounded-2xl bg-eve-cream p-3 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-eve-terra-light font-serif text-base text-eve-terra">
                  {initials(v.business_name)}
                </div>
                <div className="font-sans text-[11px] font-medium text-eve-forest line-clamp-2">
                  {v.business_name}
                </div>
                <span className="rounded-full bg-eve-sand px-2 py-0.5 font-sans text-[9px] text-eve-muted">
                  {v.category ?? "—"}
                </span>
                <TrustBadge />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 font-sans text-xs transition-colors",
              cat === c
                ? "border-eve-teal bg-eve-teal text-white"
                : "border-eve-muted/30 bg-white text-eve-muted",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* List */}
      <section className="mt-4 flex flex-col gap-3">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl bg-eve-muted/20" />)
        ) : filtered.length === 0 ? (
          <EveCard className="text-center">
            <Store className="mx-auto h-6 w-6 text-eve-teal" />
            <p className="mt-2 font-sans text-sm text-eve-muted">No vendors yet in this category.</p>
          </EveCard>
        ) : (
          filtered.map((v) => (
            <Link
              key={v.id}
              to="/eve/vendors/$id"
              params={{ id: v.id }}
              className="flex items-center gap-3 rounded-2xl bg-eve-cream p-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-eve-terra-light font-serif text-base text-eve-terra">
                {initials(v.business_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-sans text-sm font-medium text-eve-forest">
                  {v.business_name}
                </div>
                <div className="truncate font-sans text-[11px] text-eve-muted">
                  {v.category ?? "—"} {v.city ? `· ${v.city}` : ""}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <TrustBadge />
                  <span className="font-sans text-[10px] text-eve-muted">
                    · {productCounts[v.id] ?? 0} products
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-eve-muted" />
            </Link>
          ))
        )}
      </section>
    </EveShell>
  );
}
