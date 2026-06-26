import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, Star, Stethoscope, MapPin, Languages, CheckCircle2, Sparkles } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { useSavedProfile } from "@/hooks/useSavedProfile";
import { useCarePreferences } from "@/hooks/useCarePreferences";
import { prefHelpers, providerPersonalizationScore, priorityLanguagesForRegion, regionOf } from "@/lib/personalization";
import type { LifeStage } from "@/lib/match-data";
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
  services: string[] | null;
  credentials: string[] | null;
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

const STAGE_FILTER: Partial<Record<LifeStage, (typeof FILTERS)[number]>> = {
  ttc: "Fertility / IVF",
  ivf: "Fertility / IVF",
  pregnant: "OB-GYN",
  postpartum: "Midwife",
  newborn: "Pediatrician",
  pcos: "OB-GYN",
  mood: "Therapist",
  labs: "Lab",
  rx: "Pharmacy",
  insurance: "Insurance",
  wellness: "Wellness",
};

function EveProviders() {
  const nav = useNavigate();
  const { profile, hydrated } = useSavedProfile();
  const [country, setCountry] = useState<string | null>(null);
  const [items, setItems] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [autoApplied, setAutoApplied] = useState(false);

  // Pre-select filter from saved profile, once hydrated
  useEffect(() => {
    if (!hydrated || autoApplied) return;
    const stage = profile.stage as LifeStage | undefined;
    const preset = stage && STAGE_FILTER[stage];
    if (preset) setFilter(preset);
    setAutoApplied(true);
  }, [hydrated, profile.stage, autoApplied]);

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
    const base = filter === "All"
      ? items
      : items.filter((p) => (p.specialty ?? "").toLowerCase().includes(filter.toLowerCase()));
    // Personalized re-ranking: language match → city match → accepting → rating
    const userLang = (profile.language ?? "").toLowerCase();
    const userCity = (profile.city ?? "").toLowerCase();
    const score = (p: Provider) => {
      let s = 0;
      if (userLang && (p.languages ?? []).some((l) => l.toLowerCase().includes(userLang))) s += 4;
      if (userCity && (p.city ?? "").toLowerCase().includes(userCity)) s += 3;
      if (p.accepting_patients) s += 1;
      if (p.is_verified) s += 1;
      s += (p.avg_rating ?? 0) / 5;
      return s;
    };
    return [...base].sort((a, b) => score(b) - score(a));
  }, [items, filter, profile.language, profile.city]);


  return (
    <EveShell>
      <button
        onClick={() => nav({ to: "/eve/home" })}
        className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
      >
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </button>
      <h1 className="font-serif text-[26px] leading-tight text-eve-forest">
        Find the right provider
      </h1>
      <p className="mt-1 font-sans text-xs text-eve-muted">
        Doctors, midwives, doulas, labs, pharmacies, insurance and wellness — all in one place.
      </p>

      {(profile.stage || profile.city || profile.language) && (
        <div className="mt-3 rounded-xl border border-eve-teal/20 bg-white px-3 py-2 text-[11px] text-eve-teal-dark">
          Personalized for your saved profile
          {profile.city ? ` · ${profile.city}` : ""}
          {profile.language ? ` · ${profile.language}` : ""}
          {filter !== "All" ? ` · ${filter}` : ""}
        </div>
      )}

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
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center">
            <Stethoscope className="h-6 w-6 text-eve-teal" />
            <p className="font-sans text-sm text-eve-muted">
              We don't have a verified match for this yet.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {filter !== "All" && (
                <button
                  onClick={() => setFilter("All")}
                  className="rounded-full border border-eve-teal/40 px-4 py-2 font-sans text-xs text-eve-teal"
                >
                  Browse all providers
                </button>
              )}
              <Link
                to="/eve/ask"
                className="rounded-full bg-eve-teal px-4 py-2 font-sans text-xs text-white"
              >
                Ask a navigator
              </Link>
            </div>
          </div>
        ) : (
          filtered.map((p) => (
            <ProviderCard
              key={p.id}
              p={p}
              userLang={profile.language ?? null}
              userCity={profile.city ?? null}
            />
          ))
        )}
      </div>

      <div className="mt-6">
        <NavigatorHelp />
      </div>
    </EveShell>
  );
}


function ProviderCard({
  p,
  userLang,
  userCity,
}: {
  p: Provider;
  userLang?: string | null;
  userCity?: string | null;
}) {
  const langs = p.languages ?? [];
  const langMatch = !!userLang && langs.some((l) => l.toLowerCase().includes(userLang.toLowerCase()));
  const cityMatch = !!userCity && (p.city ?? "").toLowerCase().includes(userCity.toLowerCase());
  const hasMatch = langMatch || cityMatch;

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-eve-teal font-sans text-sm font-medium text-white">
          {initials(p.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-sans text-sm font-medium text-eve-forest">
              {p.full_name ?? "Doctor"}
            </h3>
            {p.is_verified && <TrustBadge />}
            {p.accepting_patients && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[10px] text-emerald-700">
                <CheckCircle2 className="h-2.5 w-2.5" /> Accepting patients
              </span>
            )}
          </div>
          <p className="font-sans text-xs text-eve-muted">
            {p.specialty ?? "General"}
            {p.clinic_name ? ` • ${p.clinic_name}` : ""}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[11px] text-eve-muted">
            {p.city && (
              <span className={cn("inline-flex items-center gap-1", cityMatch && "text-eve-teal-dark")}>
                <MapPin className="h-3 w-3" /> {p.city}
              </span>
            )}
            {langs.length > 0 && (
              <span className={cn("inline-flex items-center gap-1", langMatch && "text-eve-teal-dark")}>
                <Languages className="h-3 w-3" /> {langs.slice(0, 3).join(", ")}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
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
            {hasMatch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-eve-teal/10 px-2 py-0.5 font-sans text-[10px] text-eve-teal-dark">
                <Sparkles className="h-2.5 w-2.5" />
                {langMatch && cityMatch
                  ? "Matches your language & city"
                  : langMatch
                  ? "Speaks your language"
                  : "Near you"}
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

