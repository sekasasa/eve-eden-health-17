import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Star, Stethoscope } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/providers")({
  component: EveProviders,
});

type Provider = {
  id: string;
  full_name: string | null;
  specialty: string | null;
  clinic_name: string | null;
  city: string | null;
  languages: string[] | null;
  avg_rating: number | null;
  review_count: number | null;
  consultation_fee_mad: number | null;
  is_verified: boolean | null;
  accepting_patients: boolean | null;
};

const FILTERS = [
  "All",
  "OB-GYN",
  "Fertility / IVF",
  "Midwife",
  "Doula",
  "Pediatrician",
  "Therapist",
  "Lab",
  "Pharmacy",
  "Insurance",
  "Wellness",
  "Shops",
] as const;

function initials(name?: string | null) {
  if (!name) return "Dr";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function EveProviders() {
  const [country, setCountry] = useState<string | null>(null);
  const [items, setItems] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: m } = await supabase
          .from("mothers")
          .select("country")
          .eq("user_id", auth.user.id)
          .maybeSingle();
        setCountry(m?.country ?? "MA");
      } else {
        setCountry("MA");
      }
    })();
  }, []);

  useEffect(() => {
    if (!country) return;
    setLoading(true);
    (async () => {
      let q = supabase
        .from("providers")
        .select(
          "id,full_name,specialty,clinic_name,city,languages,avg_rating,review_count,consultation_fee_mad,is_verified,accepting_patients",
        )
        .eq("is_verified", true)
        .eq("country", country)
        .order("avg_rating", { ascending: false, nullsFirst: false });
      if (query.trim()) {
        const term = `%${query.trim()}%`;
        q = q.or(
          `full_name.ilike.${term},clinic_name.ilike.${term},specialty.ilike.${term},city.ilike.${term}`,
        );
      }
      const { data } = await q;
      setItems((data ?? []) as Provider[]);
      setLoading(false);
    })();
  }, [country, query]);

  const filtered = useMemo(() => {
    if (filter === "All") return items;
    return items.filter((p) =>
      (p.specialty ?? "").toLowerCase().includes(filter.toLowerCase()),
    );
  }, [items, filter]);

  return (
    <EveShell>
      <h1 className="font-serif text-[26px] leading-tight text-eve-forest">
        Find care
      </h1>
      <p className="mt-1 font-sans text-xs text-eve-muted">
        Doctors, midwives, doulas, labs, pharmacies, insurance and wellness — all in one place.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-full bg-eve-cream px-4 py-3">
        <Search className="h-4 w-4 text-eve-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, clinic, specialty"
          className="flex-1 bg-transparent font-sans text-sm text-eve-forest outline-none placeholder:text-eve-muted"
        />
      </div>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 font-sans text-xs transition-colors",
              filter === f
                ? "bg-eve-teal text-white"
                : "border border-eve-muted/30 bg-white text-eve-muted",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-eve-muted/20"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-8 text-center">
            <Stethoscope className="h-6 w-6 text-eve-teal" />
            <p className="font-sans text-sm text-eve-muted">
              No providers found.
            </p>
          </div>
        ) : (
          filtered.map((p) => <ProviderCard key={p.id} p={p} />)
        )}
      </div>
    </EveShell>
  );
}

function ProviderCard({ p }: { p: Provider }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-eve-teal font-sans text-sm font-medium text-white">
          {initials(p.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-sans text-sm font-medium text-eve-forest">
              {p.full_name ?? "Doctor"}
            </h3>
            {p.is_verified && <TrustBadge />}
          </div>
          <p className="font-sans text-xs text-eve-muted">
            {p.specialty ?? "General"}
            {p.clinic_name ? ` • ${p.clinic_name}` : ""}
          </p>
          <p className="mt-0.5 font-sans text-[10px] text-eve-muted">
            {p.city ?? ""}
            {p.languages?.length ? ` • ${p.languages.join(", ")}` : ""}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 font-sans text-[11px] text-eve-terra">
              <Star className="h-3 w-3 fill-eve-terra" />
              {p.avg_rating?.toFixed(1) ?? "—"}
              <span className="text-eve-muted">
                {p.review_count ? ` (${p.review_count})` : ""}
              </span>
            </span>
            {p.consultation_fee_mad != null && (
              <span className="rounded-full bg-eve-teal-light px-2 py-0.5 font-sans text-[10px] text-eve-teal-dark">
                {p.consultation_fee_mad} MAD
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Link
          to="/eve/providers/$id"
          params={{ id: p.id }}
          className="rounded-full px-3 py-1.5 font-sans text-xs text-eve-teal hover:bg-eve-teal-light"
        >
          View profile
        </Link>
        <Link to="/eve/providers/$id" params={{ id: p.id }} search={{ book: 1 }}>
          <PrimaryButton className="px-4 py-2 text-xs">Book</PrimaryButton>
        </Link>
      </div>
    </article>
  );
}
