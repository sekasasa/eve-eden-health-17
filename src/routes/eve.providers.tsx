import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Search,
  Star,
  Stethoscope,
  MapPin,
  Languages,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  X,
  Globe,
  Home as HomeIcon,
} from "lucide-react";
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
  country: string | null;
  bio: string | null;
  languages: string[] | null;
  services: string | string[] | null;
  credentials: string | string[] | null;
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

const REGIONS = [
  { id: "north_america", label: "North America" },
  { id: "africa", label: "Africa" },
  { id: "south_america", label: "South America" },
  { id: "central_america", label: "Central America" },
] as const;

const LANGUAGE_OPTIONS = [
  "English", "Spanish", "French", "Portuguese", "Arabic",
  "Darija / Moroccan Arabic", "Tamazight / Amazigh", "Swahili", "Luganda",
  "Kinyarwanda", "Amharic", "Hausa", "Yoruba", "Igbo", "Wolof", "Zulu",
  "Xhosa", "Afrikaans", "Somali", "Lingala", "Haitian Creole",
  "Jamaican Patois", "Quechua", "Guaraní", "Aymara", "K'iche'", "Kaqchikel",
  "Garifuna", "Mayan languages", "Other",
];

const PROVIDER_PREFS = [
  { id: "female", label: "Female provider", keywords: ["female", "women", "woman"] },
  { id: "modesty", label: "Modesty-sensitive care", keywords: ["modesty", "modest"] },
  { id: "faith", label: "Faith-sensitive care", keywords: ["faith", "religious", "spiritual"] },
  { id: "cultural", label: "Culturally familiar care", keywords: ["cultural", "culturally"] },
  { id: "family", label: "Family-inclusive appointments", keywords: ["family", "partner"] },
  { id: "trauma", label: "Trauma-informed care", keywords: ["trauma", "trauma-informed"] },
] as const;

const DIET_PREFS = [
  { id: "halal", label: "Halal-aware nutrition", keywords: ["halal"] },
  { id: "no_pork", label: "No-pork dietary awareness", keywords: ["no pork", "no-pork"] },
  { id: "kosher", label: "Kosher-aware nutrition", keywords: ["kosher"] },
  { id: "vegan", label: "Vegan pregnancy nutrition", keywords: ["vegan"] },
  { id: "vegetarian", label: "Vegetarian pregnancy nutrition", keywords: ["vegetarian"] },
  { id: "fasting_nutr", label: "Fasting-aware nutrition", keywords: ["fasting"] },
  { id: "postpartum_foods", label: "Postpartum cultural foods", keywords: ["postpartum food", "cultural food"] },
  { id: "traditional", label: "Traditional foods or herbal practices", keywords: ["traditional", "herbal"] },
] as const;

const FASTING_PREFS = [
  { id: "ramadan", label: "Ramadan pregnancy counseling", keywords: ["ramadan"] },
  { id: "lent", label: "Lent / Christian fasting support", keywords: ["lent", "christian fasting"] },
  { id: "orthodox", label: "Orthodox fasting support", keywords: ["orthodox fasting", "orthodox"] },
  { id: "hindu_fast", label: "Hindu fasting support", keywords: ["hindu fasting"] },
  { id: "general_fast", label: "General fasting questions", keywords: ["fasting"] },
] as const;

const BIRTH_PREFS = [
  { id: "low_int", label: "Low-intervention birth (when medically appropriate)", keywords: ["low-intervention", "low intervention", "natural"] },
  { id: "vbac", label: "VBAC counseling", keywords: ["vbac"] },
  { id: "csection", label: "C-section informed consent", keywords: ["c-section", "cesarean", "csection"] },
  { id: "birth_plan", label: "Birth plan support", keywords: ["birth plan"] },
  { id: "midwife", label: "Midwife-supported care", keywords: ["midwife", "sage-femme"] },
  { id: "doula", label: "Doula-supported care", keywords: ["doula"] },
  { id: "pain_mgmt", label: "Pain management options", keywords: ["pain management", "epidural", "analgesia"] },
] as const;

type FilterId =
  | (typeof PROVIDER_PREFS)[number]["id"]
  | (typeof DIET_PREFS)[number]["id"]
  | (typeof FASTING_PREFS)[number]["id"]
  | (typeof BIRTH_PREFS)[number]["id"];

const ALL_PREF_OPTIONS = [...PROVIDER_PREFS, ...DIET_PREFS, ...FASTING_PREFS, ...BIRTH_PREFS] as const;

function initials(name?: string | null) {
  if (!name) return "Dr";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function toLowerList(v: string | string[] | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((s) => s.toLowerCase());
  return [v.toLowerCase()];
}

function haystackFor(p: Provider): string {
  const services = toLowerList(p.services).join(" ");
  const creds = toLowerList(p.credentials).join(" ");
  const langs = (p.languages ?? []).map((l) => l.toLowerCase()).join(" ");
  return [
    services, creds, langs,
    (p.specialty ?? "").toLowerCase(),
    (p.bio ?? "").toLowerCase(),
    (p.clinic_name ?? "").toLowerCase(),
    (p.city ?? "").toLowerCase(),
    (p.country ?? "").toLowerCase(),
  ].join(" ");
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
  const { prefs } = useCarePreferences();
  const [items, setItems] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<(typeof FILTERS)[number]>("All");
  const [autoApplied, setAutoApplied] = useState(false);

  // Advanced filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterVirtual, setFilterVirtual] = useState(false);
  const [filterHomeVisit, setFilterHomeVisit] = useState(false);
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]);
  const [filterDialect, setFilterDialect] = useState<string>("");
  const [filterPrefs, setFilterPrefs] = useState<FilterId[]>([]);

  // Pre-select specialty + seed from care prefs
  useEffect(() => {
    if (!hydrated || autoApplied) return;
    const stage = profile.stage as LifeStage | undefined;
    const preset = stage && STAGE_FILTER[stage];
    if (preset) setSpecialty(preset);
    setAutoApplied(true);
  }, [hydrated, profile.stage, autoApplied]);

  // Seed filters from saved care preferences once they load
  useEffect(() => {
    if (prefs.region && !filterRegion) {
      const r = prefs.region.toLowerCase();
      const match = REGIONS.find((x) => r.includes(x.id.split("_")[0]));
      if (match) setFilterRegion(match.id);
    }
    if (prefs.country && !filterCountry) setFilterCountry(prefs.country);
    if (prefs.city && !filterCity) setFilterCity(prefs.city);
    if (prefs.language && filterLanguages.length === 0) {
      setFilterLanguages([prefs.language]);
    }
    if (prefs.dialect && !filterDialect) setFilterDialect(prefs.dialect);
    if (prefs.care_setting === "virtual") setFilterVirtual(true);
    if (prefs.care_setting === "home") setFilterHomeVisit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.region, prefs.country, prefs.city, prefs.language, prefs.dialect, prefs.care_setting]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let q = supabase
        .from("providers")
        .select(
          "id,full_name,specialty,clinic_name,city,country,bio,languages,services,credentials,avg_rating,review_count,consultation_fee_mad,is_verified,accepting_patients",
        )
        .eq("is_verified", true)
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
  }, [query]);

  const region = filterRegion ?? regionOf(prefs);
  const regionalLangs = useMemo(
    () => priorityLanguagesForRegion(region as ReturnType<typeof regionOf>),
    [region],
  );

  // Apply hard filters first (country/city/virtual/home/etc) then rank.
  const { filtered, matched } = useMemo(() => {
    const base = specialty === "All"
      ? items
      : items.filter((p) => (p.specialty ?? "").toLowerCase().includes(specialty.toLowerCase()));

    const passed = base.filter((p) => {
      const hay = haystackFor(p);
      if (filterCountry.trim()) {
        const c = filterCountry.trim().toLowerCase();
        if (!(p.country ?? "").toLowerCase().includes(c)) return false;
      }
      if (filterCity.trim()) {
        const c = filterCity.trim().toLowerCase();
        if (!(p.city ?? "").toLowerCase().includes(c)) return false;
      }
      if (filterVirtual && !/virtual|telehealth|teleconsult|online|en ligne/.test(hay)) return false;
      if (filterHomeVisit && !/home visit|à domicile|domicile|home-visit|in-home/.test(hay)) return false;
      if (filterLanguages.length > 0) {
        const langs = (p.languages ?? []).map((l) => l.toLowerCase());
        const ok = filterLanguages.some((sel) =>
          langs.some((l) => l.includes(sel.toLowerCase().split(" / ")[0])),
        );
        if (!ok) return false;
      }
      if (filterDialect.trim()) {
        const d = filterDialect.trim().toLowerCase();
        const langs = (p.languages ?? []).map((l) => l.toLowerCase());
        if (!langs.some((l) => l.includes(d))) return false;
      }
      for (const id of filterPrefs) {
        const opt = ALL_PREF_OPTIONS.find((o) => o.id === id);
        if (!opt) continue;
        const ok = opt.keywords.some((k) => hay.includes(k));
        if (!ok) return false;
      }
      return true;
    });

    const score = (p: Provider) => {
      let s = providerPersonalizationScore(
        {
          languages: p.languages,
          city: p.city,
          services: toLowerList(p.services),
          credentials: toLowerList(p.credentials),
        },
        prefs,
      );
      if (regionalLangs.length && (p.languages ?? []).some((l) => regionalLangs.includes(l.toLowerCase()))) s += 1;
      const userLang = (profile.language ?? "").toLowerCase();
      const userCity = (profile.city ?? "").toLowerCase();
      if (!prefs.language && userLang && (p.languages ?? []).some((l) => l.toLowerCase().includes(userLang))) s += 2;
      if (!prefs.city && userCity && (p.city ?? "").toLowerCase().includes(userCity)) s += 2;
      if (p.accepting_patients) s += 1;
      if (p.is_verified) s += 1;
      s += (p.avg_rating ?? 0) / 5;
      return s;
    };

    return {
      filtered: [...passed].sort((a, b) => score(b) - score(a)),
      matched: passed.length,
    };
  }, [items, specialty, prefs, profile.language, profile.city, regionalLangs, filterCountry, filterCity, filterVirtual, filterHomeVisit, filterLanguages, filterDialect, filterPrefs]);

  const femalePreferred = prefHelpers.femalePreferred(prefs) || filterPrefs.includes("female");
  const verifiedFemaleConfirmable = filtered.some((p) => /female|women's health|women only/.test(haystackFor(p)));

  const activeFilterCount =
    (filterRegion ? 1 : 0) +
    (filterCountry ? 1 : 0) +
    (filterCity ? 1 : 0) +
    (filterVirtual ? 1 : 0) +
    (filterHomeVisit ? 1 : 0) +
    filterLanguages.length +
    (filterDialect ? 1 : 0) +
    filterPrefs.length;

  function resetFilters() {
    setFilterRegion(null);
    setFilterCountry("");
    setFilterCity("");
    setFilterVirtual(false);
    setFilterHomeVisit(false);
    setFilterLanguages([]);
    setFilterDialect("");
    setFilterPrefs([]);
  }

  function toggleLang(l: string) {
    setFilterLanguages((cur) => cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]);
  }
  function togglePref(id: FilterId) {
    setFilterPrefs((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

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
        Search by region, language, dialect, and what matters to you. We rank using only your stated preferences.
      </p>

      {(profile.stage || profile.city || profile.language || prefs.region) && (
        <div className="mt-3 rounded-xl border border-eve-teal/20 bg-white px-3 py-2 text-[11px] text-eve-teal-dark">
          Personalized for your stated preferences
          {prefs.region ? ` · ${prefs.region}` : ""}
          {(prefs.city ?? profile.city) ? ` · ${prefs.city ?? profile.city}` : ""}
          {(prefs.language ?? profile.language) ? ` · ${prefs.language ?? profile.language}` : ""}
          {specialty !== "All" ? ` · ${specialty}` : ""}
        </div>
      )}

      {femalePreferred && !verifiedFemaleConfirmable && (
        <div className="mt-2 rounded-xl border border-eve-rose/30 bg-eve-rose-light px-3 py-2 text-[11px] text-eve-rose">
          You asked for a female provider. We can't yet confirm a verified female-provider match in our directory.{" "}
          <Link to="/eve/ask" className="font-medium underline">Ask a navigator for help</Link>.
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-eve-cream px-4 py-3">
          <Search className="h-4 w-4 text-eve-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, clinic, specialty"
            className="flex-1 bg-transparent font-sans text-sm text-eve-forest outline-none placeholder:text-eve-muted"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-3 text-xs",
            activeFilterCount > 0
              ? "border-eve-teal bg-eve-teal text-white"
              : "border-eve-muted/30 bg-white text-eve-muted",
          )}
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="ml-1 text-[11px] font-medium">{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setSpecialty(f)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 font-sans text-xs transition-colors",
              specialty === f
                ? "bg-eve-teal text-white"
                : "border border-eve-muted/30 bg-white text-eve-muted",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {showFilters && (
        <FilterPanel
          filterRegion={filterRegion} setFilterRegion={setFilterRegion}
          filterCountry={filterCountry} setFilterCountry={setFilterCountry}
          filterCity={filterCity} setFilterCity={setFilterCity}
          filterVirtual={filterVirtual} setFilterVirtual={setFilterVirtual}
          filterHomeVisit={filterHomeVisit} setFilterHomeVisit={setFilterHomeVisit}
          filterLanguages={filterLanguages} toggleLang={toggleLang}
          filterDialect={filterDialect} setFilterDialect={setFilterDialect}
          filterPrefs={filterPrefs} togglePref={togglePref}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <p className="mt-3 font-sans text-[11px] text-eve-muted">
        {loading ? "Searching…" : `${matched} provider${matched === 1 ? "" : "s"} match your preferences`}
      </p>

      <div className="mt-2 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-eve-muted/20" />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            country={(filterCountry || prefs.country) ?? null}
            onClearFilters={activeFilterCount > 0 ? resetFilters : undefined}
            onSearchVirtual={() => {
              resetFilters();
              setFilterVirtual(true);
            }}
          />
        ) : (
          filtered.map((p) => (
            <ProviderCard
              key={p.id}
              p={p}
              userLang={profile.language ?? null}
              userCity={profile.city ?? null}
              prefsCountry={(filterCountry || prefs.country) ?? null}
              prefsLanguages={filterLanguages.length ? filterLanguages : (prefs.language ? [prefs.language] : [])}
              prefsDialect={filterDialect || prefs.dialect || ""}
              activePrefs={filterPrefs}
              femalePref={femalePreferred}
              virtualWanted={filterVirtual}
              homeVisitWanted={filterHomeVisit}
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

function FilterPanel(props: {
  filterRegion: string | null; setFilterRegion: (v: string | null) => void;
  filterCountry: string; setFilterCountry: (v: string) => void;
  filterCity: string; setFilterCity: (v: string) => void;
  filterVirtual: boolean; setFilterVirtual: (v: boolean) => void;
  filterHomeVisit: boolean; setFilterHomeVisit: (v: boolean) => void;
  filterLanguages: string[]; toggleLang: (l: string) => void;
  filterDialect: string; setFilterDialect: (v: string) => void;
  filterPrefs: FilterId[]; togglePref: (id: FilterId) => void;
  activeCount: number;
  onReset: () => void;
  onClose: () => void;
}) {
  const {
    filterRegion, setFilterRegion, filterCountry, setFilterCountry,
    filterCity, setFilterCity, filterVirtual, setFilterVirtual,
    filterHomeVisit, setFilterHomeVisit, filterLanguages, toggleLang,
    filterDialect, setFilterDialect, filterPrefs, togglePref,
    activeCount, onReset, onClose,
  } = props;

  return (
    <section className="mt-3 rounded-2xl border border-eve-teal/20 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-sm font-semibold text-eve-teal-dark">Filters</h2>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={onReset} className="text-[11px] text-eve-muted underline">
              Clear all
            </button>
          )}
          <button onClick={onClose} aria-label="Close filters">
            <X className="h-4 w-4 text-eve-muted" />
          </button>
        </div>
      </div>

      {/* Location */}
      <Group title="Location">
        <div className="grid grid-cols-2 gap-2">
          {REGIONS.map((r) => (
            <Chip
              key={r.id}
              active={filterRegion === r.id}
              onClick={() => setFilterRegion(filterRegion === r.id ? null : r.id)}
            >
              {r.label}
            </Chip>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            placeholder="Country (e.g. MA, US)"
            className="rounded-lg border border-eve-muted/30 px-3 py-2 font-sans text-xs"
          />
          <input
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            placeholder="City or region"
            className="rounded-lg border border-eve-muted/30 px-3 py-2 font-sans text-xs"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip active={filterVirtual} onClick={() => setFilterVirtual(!filterVirtual)}>
            <Globe className="mr-1 inline h-3 w-3" /> Virtual care available
          </Chip>
          <Chip active={filterHomeVisit} onClick={() => setFilterHomeVisit(!filterHomeVisit)}>
            <HomeIcon className="mr-1 inline h-3 w-3" /> Home visit available
          </Chip>
        </div>
      </Group>

      {/* Languages */}
      <Group title="Language">
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGE_OPTIONS.map((l) => (
            <Chip key={l} active={filterLanguages.includes(l)} onClick={() => toggleLang(l)}>
              {l}
            </Chip>
          ))}
        </div>
        <input
          value={filterDialect}
          onChange={(e) => setFilterDialect(e.target.value)}
          placeholder="Dialect (optional)"
          className="mt-2 w-full rounded-lg border border-eve-muted/30 px-3 py-2 font-sans text-xs"
        />
      </Group>

      {/* Provider preferences */}
      <Group title="Provider preferences">
        <div className="flex flex-wrap gap-1.5">
          {PROVIDER_PREFS.map((o) => (
            <Chip key={o.id} active={filterPrefs.includes(o.id)} onClick={() => togglePref(o.id)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </Group>

      {/* Diet */}
      <Group title="Diet & nutrition support">
        <div className="flex flex-wrap gap-1.5">
          {DIET_PREFS.map((o) => (
            <Chip key={o.id} active={filterPrefs.includes(o.id)} onClick={() => togglePref(o.id)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </Group>

      {/* Fasting */}
      <Group title="Fasting support">
        <div className="flex flex-wrap gap-1.5">
          {FASTING_PREFS.map((o) => (
            <Chip key={o.id} active={filterPrefs.includes(o.id)} onClick={() => togglePref(o.id)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </Group>

      {/* Birth */}
      <Group title="Birth preferences">
        <div className="flex flex-wrap gap-1.5">
          {BIRTH_PREFS.map((o) => (
            <Chip key={o.id} active={filterPrefs.includes(o.id)} onClick={() => togglePref(o.id)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </Group>

      <p className="mt-3 text-[10px] text-eve-muted">
        These preferences are optional and used only to personalize results. You can change or clear them anytime.
      </p>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 font-sans text-[11px] font-medium uppercase tracking-wide text-eve-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 font-sans text-[11px] transition-colors",
        active
          ? "border-eve-teal bg-eve-teal text-white"
          : "border-eve-muted/30 bg-white text-eve-teal-dark",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center">
      <Stethoscope className="h-6 w-6 text-eve-teal" />
      <p className="font-sans text-sm text-eve-teal-dark">
        We do not have a confirmed match for these preferences yet.
      </p>
      <p className="font-sans text-xs text-eve-muted">
        Ask a navigator and we'll help you find care.
      </p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-full border border-eve-teal/40 px-4 py-2 font-sans text-xs text-eve-teal"
          >
            Clear filters
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
  );
}

function buildMatchReasons(
  p: Provider,
  opts: {
    userLang?: string | null;
    userCity?: string | null;
    prefsCountry?: string | null;
    prefsLanguages: string[];
    prefsDialect: string;
    activePrefs: FilterId[];
    femalePref: boolean;
    virtualWanted: boolean;
    homeVisitWanted: boolean;
  },
): string[] {
  const reasons: string[] = [];
  const hay = haystackFor(p);
  const langs = (p.languages ?? []).map((l) => l.toLowerCase());

  const langSelections = opts.prefsLanguages.length ? opts.prefsLanguages : (opts.userLang ? [opts.userLang] : []);
  if (langSelections.some((sel) => langs.some((l) => l.includes(sel.toLowerCase().split(" / ")[0])))) {
    reasons.push("Speaks your preferred language");
  }
  if (opts.prefsDialect && langs.some((l) => l.includes(opts.prefsDialect.toLowerCase()))) {
    reasons.push("Supports your preferred dialect");
  }
  if (opts.prefsCountry && (p.country ?? "").toLowerCase().includes(opts.prefsCountry.toLowerCase())) {
    reasons.push("Located in your country");
  }
  if (opts.userCity && (p.city ?? "").toLowerCase().includes(opts.userCity.toLowerCase())) {
    reasons.push("Near you");
  }
  if (opts.virtualWanted && /virtual|telehealth|online/.test(hay)) reasons.push("Offers virtual care");
  if (opts.homeVisitWanted && /home visit|domicile|in-home/.test(hay)) reasons.push("Offers home visits");

  if (opts.femalePref && /female|women's health|women only/.test(hay)) reasons.push("Female provider");

  const labels: Partial<Record<FilterId, string>> = {
    modesty: "Supports modesty-sensitive care",
    faith: "Faith-sensitive care",
    cultural: "Offers culturally familiar care",
    family: "Family-inclusive appointments",
    trauma: "Trauma-informed care",
    ramadan: "Can discuss Ramadan and pregnancy",
    vegan: "Supports vegan pregnancy nutrition",
    vegetarian: "Supports vegetarian pregnancy nutrition",
    halal: "Halal-aware nutrition",
    kosher: "Kosher-aware nutrition",
    fasting_nutr: "Fasting-aware nutrition",
    vbac: "Can discuss VBAC options",
    low_int: "Supports low-intervention birth, when medically appropriate",
    csection: "Can walk through C-section informed consent",
    birth_plan: "Helps with birth plan",
    midwife: "Midwife-supported care",
    doula: "Doula-supported care",
    pain_mgmt: "Discusses pain management options",
    lent: "Lent / Christian fasting support",
    orthodox: "Orthodox fasting support",
    hindu_fast: "Hindu fasting support",
    general_fast: "Discusses general fasting questions",
    postpartum_foods: "Supports postpartum cultural foods",
    traditional: "Open to traditional / herbal practices",
    no_pork: "No-pork dietary awareness",
  };
  for (const id of opts.activePrefs) {
    const opt = ALL_PREF_OPTIONS.find((o) => o.id === id);
    if (opt && opt.keywords.some((k) => hay.includes(k)) && labels[id]) {
      reasons.push(labels[id]!);
    }
  }
  // De-dupe and cap
  return Array.from(new Set(reasons)).slice(0, 4);
}

function ProviderCard({
  p,
  userLang,
  userCity,
  prefsCountry,
  prefsLanguages,
  prefsDialect,
  activePrefs,
  femalePref,
  virtualWanted,
  homeVisitWanted,
}: {
  p: Provider;
  userLang?: string | null;
  userCity?: string | null;
  prefsCountry?: string | null;
  prefsLanguages: string[];
  prefsDialect: string;
  activePrefs: FilterId[];
  femalePref: boolean;
  virtualWanted: boolean;
  homeVisitWanted: boolean;
}) {
  const langs = p.languages ?? [];
  const reasons = buildMatchReasons(p, {
    userLang, userCity, prefsCountry, prefsLanguages, prefsDialect,
    activePrefs, femalePref, virtualWanted, homeVisitWanted,
  });
  const cityMatch = !!userCity && (p.city ?? "").toLowerCase().includes(userCity.toLowerCase());
  const langMatch = !!userLang && langs.some((l) => l.toLowerCase().includes(userLang.toLowerCase()));

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
                <MapPin className="h-3 w-3" /> {p.city}{p.country ? `, ${p.country}` : ""}
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
          </div>

          {reasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reasons.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-full bg-eve-teal/10 px-2 py-0.5 font-sans text-[10px] text-eve-teal-dark"
                >
                  <Sparkles className="h-2.5 w-2.5" /> {r}
                </span>
              ))}
            </div>
          )}
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
