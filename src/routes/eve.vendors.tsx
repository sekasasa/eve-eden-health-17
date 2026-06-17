import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpDown, ChevronRight, Search, Store, X } from "lucide-react";
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
  "Care Services",
  "Maternity wear",
  "Baby gear",
  "Nutrition",
  "Pharmacy",
  "Classes",
] as const;

const CATEGORY_VALUE: Record<string, string> = {
  "Care Services": "care_services",
  "Maternity wear": "maternity_wear",
  "Baby gear": "baby_gear",
  Nutrition: "nutrition",
  Pharmacy: "pharmacy",
  Classes: "classes",
};

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
  services: string | null;
  languages: string[] | null;
  credentials: string | null;
  avg_rating: number | null;
  created_at: string | null;
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

const STAGE_VENDOR_HINT: Partial<Record<LifeStage, string>> = {
  ivf: "Fertility support products, wellness, nutrition, and emotional support.",
  ttc: "Preconception wellness, supplements, nutrition and cycle tracking tools.",
  pregnant: "Maternity essentials, prenatal classes, doulas, and birth prep.",
  postpartum: "Postpartum recovery, lactation support, baby essentials, meal support.",
  newborn: "Baby essentials, feeding vendors, pediatric and pharmacy support.",
  pcos: "Hormonal-friendly nutrition, wellness, and supplements.",
  mood: "Mental health, mindfulness, and wellness services.",
  wellness: "Preventive wellness, nutrition, and trusted local services.",
};

function EveVendors() {
  const nav = useNavigate();
  const { profile } = useSavedProfile();
  const stage = profile.stage as LifeStage | undefined;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [country, setCountry] = useState<string>("MA");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [serviceQuery, setServiceQuery] = useState("");
  const [language, setLanguage] = useState<string>("");
  const [credential, setCredential] = useState<string>("");
  const [userCity, setUserCity] = useState<string>("");
  const [sortBy, setSortBy] = useState<"recommended" | "nearest" | "newest" | "highest_rated">("recommended");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        const { data: m } = await supabase
          .from("mothers")
          .select("country, city")
          .eq("user_id", userId)
          .maybeSingle();
        if (m?.country) setCountry(m.country);
        if (m?.city) setUserCity(m.city);
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
    const sq = serviceQuery.trim().toLowerCase();
    const cq = credential.trim().toLowerCase();
    return vendors
      .filter((v) => (v.country ?? "MA") === country)
      .filter((v) => (cat === "All" ? true : v.category === CATEGORY_VALUE[cat]))
      .filter((v) =>
        sq
          ? (v.services ?? "").toLowerCase().includes(sq) ||
            (v.description ?? "").toLowerCase().includes(sq) ||
            (v.business_name ?? "").toLowerCase().includes(sq)
          : true,
      )
      .filter((v) =>
        language ? (v.languages ?? []).some((l) => l?.toLowerCase() === language.toLowerCase()) : true,
      )
      .filter((v) => (cq ? (v.credentials ?? "").toLowerCase().includes(cq) : true));
  }, [vendors, country, cat, serviceQuery, language, credential]);

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => (v.languages ?? []).forEach((l) => l && set.add(l)));
    return Array.from(set).sort();
  }, [vendors]);

  const credentialOptions = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => {
      const c = (v.credentials ?? "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [vendors]);

  const hasActiveFilters = !!(serviceQuery || language || credential || cat !== "All");

  const featured = useMemo(() => vendors.filter((v) => v.is_featured), [vendors]);

  return (
    <EveShell>
      <button
        onClick={() => nav({ to: "/eve/home" })}
        className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
      >
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </button>
      <header className="pt-2">
        <h1 className="font-serif text-2xl text-eve-forest">Shops & services</h1>
        <p className="mt-1 font-sans text-sm text-eve-muted">
          Trusted products and non-clinical support, personalized to your care profile.
        </p>
        {stage && STAGE_VENDOR_HINT[stage] && (
          <p className="mt-2 rounded-xl border border-eve-teal/20 bg-white px-3 py-2 text-[11px] text-eve-teal-dark">
            Recommended for you: {STAGE_VENDOR_HINT[stage]}
          </p>
        )}
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

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-full bg-eve-cream px-4 py-2.5">
          <Search className="h-4 w-4 text-eve-muted" />
          <input
            value={serviceQuery}
            onChange={(e) => setServiceQuery(e.target.value)}
            placeholder="Search services (e.g. lactation, prenatal yoga)"
            className="flex-1 bg-transparent font-sans text-xs text-eve-forest outline-none placeholder:text-eve-muted"
          />
          {serviceQuery && (
            <button onClick={() => setServiceQuery("")} aria-label="Clear">
              <X className="h-3.5 w-3.5 text-eve-muted" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="flex-1 rounded-full border border-eve-muted/30 bg-white px-3 py-2 font-sans text-xs text-eve-forest outline-none"
          >
            <option value="">All languages</option>
            {languageOptions.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            className="flex-1 rounded-full border border-eve-muted/30 bg-white px-3 py-2 font-sans text-xs text-eve-forest outline-none"
          >
            <option value="">All credentials</option>
            {credentialOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setServiceQuery("");
              setLanguage("");
              setCredential("");
              setCat("All");
            }}
            className="self-end font-sans text-[11px] text-eve-teal"
          >
            Clear filters
          </button>
        )}
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
