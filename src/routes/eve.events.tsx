import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Globe, ArrowRight, Sparkles, SlidersHorizontal, Users, Tag } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { supabase } from "@/integrations/supabase/client";
import { useCarePreferences } from "@/hooks/useCarePreferences";
import { priorityLanguagesForRegion, regionOf, prefHelpers, type Region } from "@/lib/personalization";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/events")({
  component: EventsPage,
  head: () => ({
    meta: [
      { title: "Events & workshops — Eve & Eden" },
      {
        name: "description",
        content:
          "Maternal-health events, classes, and support groups across North America, Africa, South America, and Central America.",
      },
    ],
  }),
});

type EventRow = {
  id: string;
  title: string;
  excerpt: string | null;
  location: string | null;
  language: string | null;
  category: string | null;
  life_stage: string | null;
  event_at: string | null;
  cta_type: string | null;
  cta_url: string | null;
  media_url: string | null;
  price_label: string | null;
  vendor_id: string;
  vendors?: { business_name: string | null } | null;
  is_featured?: boolean;
  source?: "vendor" | "seed";
};

type DirectoryRow = {
  id: string;
  resource_name: string;
  category: string | null;
  region: string | null;
  country: string | null;
  city_scope: string | null;
  language_support: string | null;
  display_section: string | null;
  source_url: string | null;
  notes: string | null;
};

const REGIONS: { key: Region; label: string }[] = [
  { key: "north_america", label: "North America" },
  { key: "africa", label: "Africa" },
  { key: "south_america", label: "South America" },
  { key: "central_america", label: "Central America" },
];

const LIFE_STAGES = ["trying", "fertility", "pregnant", "postpartum", "newborn", "family"];

const TOPIC_TAGS: { key: string; label: string; keywords: string[] }[] = [
  { key: "faith", label: "Faith-sensitive care", keywords: ["faith", "halal", "kosher", "ramadan", "lent", "modesty"] },
  { key: "nutrition", label: "Nutrition", keywords: ["nutrition", "food", "diet", "iron", "anemia"] },
  { key: "fasting", label: "Fasting", keywords: ["fasting", "ramadan", "lent"] },
  { key: "vegan", label: "Vegan / vegetarian pregnancy", keywords: ["vegan", "vegetarian", "plant"] },
  { key: "birth", label: "Birth planning", keywords: ["birth plan", "birth-plan", "labor", "delivery"] },
  { key: "vbac", label: "VBAC / C-section education", keywords: ["vbac", "c-section", "cesarean"] },
  { key: "postpartum-trad", label: "Postpartum traditions", keywords: ["postpartum tradition", "40 days", "cuarentena", "nifas", "confinement"] },
  { key: "family", label: "Family support", keywords: ["family", "partner", "siblings"] },
  { key: "emotional", label: "Emotional support", keywords: ["emotional", "mental", "anxiety", "grief", "depression", "support group"] },
];

type Filters = {
  region: Region | "any";
  country: string;
  city: string;
  online: "any" | "online" | "in_person";
  language: string;
  stage: string;
  price: "any" | "free" | "paid";
  topics: string[];
};

function EventsPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [directories, setDirectories] = useState<DirectoryRow[]>([]);
  const { prefs } = useCarePreferences();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    region: "any",
    country: "",
    city: "",
    online: "any",
    language: "",
    stage: "",
    price: "any",
    topics: [],
  });

  // Seed filters from saved Care Preferences on first load
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      region: (regionOf(prefs) as Region | null) ?? f.region,
      country: prefs.country ?? f.country,
      city: prefs.city ?? f.city,
      language: prefs.language ?? f.language,
      stage: prefs.stage ?? f.stage,
      online: prefs.care_setting === "virtual" ? "online" : f.online,
    }));
  }, [prefs.region, prefs.country, prefs.city, prefs.language, prefs.stage, prefs.care_setting]);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const [vendorRes, seedRes, dirRes] = await Promise.all([
        supabase
          .from("vendor_content")
          .select(
            "id,title,excerpt,location,language,category,life_stage,event_at,cta_type,cta_url,media_url,price_label,vendor_id,vendors(business_name)",
          )
          .eq("content_type", "event")
          .eq("status", "published")
          .or(`event_at.gte.${nowIso},event_at.is.null`)
          .order("event_at", { ascending: true, nullsFirst: false })
          .limit(100),
        // RLS filters to display_in_app=true AND status IN (eve_hosted,partner_hosted,verified,registration_confirmed)
        supabase
          .from("seed_events")
          .select(
            "id,title,short_description,city,country,location_type,date_time_local,languages,event_category_tags,life_stage_tags,price_type,price_amount,currency,registration_type,registration_url,host_name,is_featured",
          )
          .limit(100),
        supabase
          .from("directory_resources")
          .select("id,resource_name,category,region,country,city_scope,language_support,display_section,source_url,notes")
          .limit(50),
      ]);

      const vendorRows = (vendorRes.data as unknown as EventRow[]) ?? [];
      const seedRows: EventRow[] = ((seedRes.data as unknown as Array<Record<string, unknown>>) ?? []).map((s) => {
        const dt = String(s.date_time_local ?? "");
        const parsed = /^\d{4}-\d{2}-\d{2}/.test(dt) ? new Date(dt.replace(" ", "T")) : null;
        const eventAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null;
        const loc =
          s.location_type === "online"
            ? "Online"
            : [s.city, s.country].filter(Boolean).join(", ") || null;
        const price =
          s.price_type === "free"
            ? "Free"
            : s.price_amount
              ? `${s.price_amount} ${s.currency ?? ""}`.trim()
              : "Price on registration";
        const langs = String(s.languages ?? "").split(/;|,/).map((x) => x.trim()).filter(Boolean);
        return {
          id: `seed-${s.id}`,
          title: String(s.title ?? ""),
          excerpt: (s.short_description as string) ?? null,
          location: loc,
          language: langs[0] ?? null,
          category: ((s.event_category_tags as string) ?? "").split(";")[0]?.trim() || null,
          life_stage: ((s.life_stage_tags as string) ?? "").split(";")[0]?.trim() || null,
          event_at: eventAt,
          cta_type: s.registration_url ? "register" : null,
          cta_url: (s.registration_url as string) ?? null,
          media_url: null,
          price_label: price,
          vendor_id: "",
          vendors: { business_name: (s.host_name as string) ?? "Eve & Eden" },
          is_featured: Boolean(s.is_featured),
          source: "seed",
        };
      });

      // Featured launch event first, then merged list
      const merged = [...seedRows, ...vendorRows];
      merged.sort((a, b) => Number(b.is_featured ?? false) - Number(a.is_featured ?? false));
      setEvents(merged);
      setDirectories((dirRes.data as unknown as DirectoryRow[]) ?? []);
    })();
  }, []);


  const activeCount =
    (filters.region !== "any" ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.online !== "any" ? 1 : 0) +
    (filters.language ? 1 : 0) +
    (filters.stage ? 1 : 0) +
    (filters.price !== "any" ? 1 : 0) +
    filters.topics.length;

  const { results, anyInCountry } = useMemo(() => {
    if (!events) return { results: [] as EventRow[], anyInCountry: true };
    const region = filters.region === "any" ? regionOf(prefs) : filters.region;
    const regionalLangs = priorityLanguagesForRegion(region);

    const country = filters.country.toLowerCase().trim();
    const city = filters.city.toLowerCase().trim();
    const lang = filters.language.toLowerCase().trim();
    const stage = filters.stage;

    const isOnline = (e: EventRow) => {
      const l = (e.location ?? "").toLowerCase();
      return !e.location || l.includes("online") || l.includes("virtual") || l.includes("zoom");
    };
    const isFree = (e: EventRow) => /free|gratis|gratuit/i.test(e.price_label ?? "");

    const matchTopic = (e: EventRow, key: string) => {
      const t = TOPIC_TAGS.find((x) => x.key === key);
      if (!t) return false;
      const hay = `${e.title} ${e.excerpt ?? ""} ${e.category ?? ""}`.toLowerCase();
      return t.keywords.some((k) => hay.includes(k));
    };

    const filtered = events.filter((e) => {
      const loc = (e.location ?? "").toLowerCase();
      if (filters.online === "online" && !isOnline(e)) return false;
      if (filters.online === "in_person" && isOnline(e)) return false;
      if (country && !loc.includes(country) && !isOnline(e)) return false;
      if (city && !loc.includes(city) && !isOnline(e)) return false;
      if (lang && (e.language ?? "").toLowerCase() !== lang) return false;
      if (stage && e.life_stage !== stage) return false;
      if (filters.price === "free" && !isFree(e)) return false;
      if (filters.price === "paid" && isFree(e)) return false;
      if (filters.topics.length && !filters.topics.every((t) => matchTopic(e, t))) return false;
      return true;
    });

    const score = (e: EventRow) => {
      let s = 0;
      // Featured launch event always pinned for matching Morocco/Casablanca/Rabat audiences
      if (e.is_featured) {
        const loc = (e.location ?? "").toLowerCase();
        const matchesMa =
          !country ||
          country === "morocco" ||
          loc.includes("morocco") ||
          loc.includes("casablanca") ||
          loc.includes("rabat");
        if (matchesMa) s += 100;
      }
      if (stage && e.life_stage === stage) s += 5;
      if (lang && (e.language ?? "").toLowerCase() === lang) s += 4;
      else if (regionalLangs.length && e.language && regionalLangs.includes(e.language.toLowerCase())) s += 2;
      const loc = (e.location ?? "").toLowerCase();
      if (city && loc.includes(city)) s += 3;
      else if (country && loc.includes(country)) s += 2;
      if (filters.online === "online" && isOnline(e)) s += 1;
      const hay = `${e.title} ${e.excerpt ?? ""} ${e.category ?? ""}`.toLowerCase();
      if (prefHelpers.ramadan(prefs) && hay.includes("ramadan")) s += 3;
      if (prefHelpers.vbac(prefs) && hay.includes("vbac")) s += 3;
      if (prefHelpers.vegan(prefs) && (hay.includes("vegan") || hay.includes("plant"))) s += 2;
      return s;
    };

    const sorted = [...filtered].sort((a, b) => score(b) - score(a));

    // Check whether any events exist in the country filter (ignoring online)
    const anyInCountry =
      !country ||
      events.some((e) => (e.location ?? "").toLowerCase().includes(country));

    return { results: sorted, anyInCountry };
  }, [events, filters, prefs]);

  const personalized = !!(prefs.region || prefs.country || prefs.city || prefs.language || prefs.stage);
  const noResults = events !== null && results.length === 0;
  const showCountryEmpty = noResults && filters.country && !anyInCountry;

  function toggleTopic(k: string) {
    setFilters((f) => ({
      ...f,
      topics: f.topics.includes(k) ? f.topics.filter((x) => x !== k) : [...f.topics, k],
    }));
  }

  function clearAll() {
    setFilters({
      region: "any",
      country: "",
      city: "",
      online: "any",
      language: "",
      stage: "",
      price: "any",
      topics: [],
    });
  }

  return (
    <EveShell>
      <div className="pt-2">
        <h1 className="font-serif text-3xl text-eve-teal-dark">Events & Workshops</h1>
        <p className="mt-1 font-sans text-sm text-eve-muted">
          Classes, talks, and community gatherings across North America, Africa, South America, and Central America.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-full border border-eve-teal/30 bg-white px-3 py-1.5 text-xs font-medium text-eve-teal-dark"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-eve-teal px-1.5 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
        {personalized && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-eve-teal-light px-3 py-1 text-[11px] text-eve-teal-dark">
            <Sparkles className="h-3 w-3" />
            Sorted by your preferences
          </span>
        )}
        {activeCount > 0 && (
          <button onClick={clearAll} className="ml-auto text-[11px] text-eve-muted underline">
            Clear all
          </button>
        )}
      </div>

      {showFilters && (
        <FilterPanel filters={filters} setFilters={setFilters} toggleTopic={toggleTopic} />
      )}

      {events === null ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-eve-cream/60" />
          ))}
        </div>
      ) : noResults ? (
        <div className="mt-6 space-y-4">
          {showCountryEmpty ? (
            <EmptyState
              icon={Calendar}
              title="No events yet in your area"
              description="We're still building event partners in your country. Online events are open to everyone."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, country: "", city: "", online: "online" }))}
                    className="rounded-full bg-eve-teal px-4 py-2 text-xs font-medium text-white"
                  >
                    See online events
                  </button>
                  <Link
                    to="/eve/ask"
                    className="rounded-full border border-eve-teal px-4 py-2 text-xs font-medium text-eve-teal"
                  >
                    Ask a navigator
                  </Link>
                </div>
              }
            />
          ) : (
            <EmptyState
              icon={Calendar}
              title="No events match these filters"
              description="Try removing a filter or browse online events open to everyone."
              action={
                <button
                  onClick={clearAll}
                  className="rounded-full border border-eve-teal px-4 py-2 text-xs font-medium text-eve-teal"
                >
                  Clear filters
                </button>
              }
            />
          )}
          <NavigatorHelp
            label="Looking for a class or support group?"
            sub="Ask a navigator — we'll help you find prenatal classes, support groups, or local maternal care events."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="text-[11px] text-eve-muted">
            {results.length} event{results.length === 1 ? "" : "s"}
          </p>
          {results.map((e) => (
            <EventCard key={e.id} ev={e} />
          ))}
          <div className="pt-2">
            <NavigatorHelp variant="inline" />
          </div>
        </div>
      )}

      <Link
        to="/eden/login"
        className="mt-8 block rounded-2xl bg-eve-teal-light p-4 text-center text-sm text-eve-teal-dark"
      >
        Hosting a maternal health event? <span className="font-semibold">Add it on Eve & Eden →</span>
      </Link>
    </EveShell>
  );
}

function FilterPanel({
  filters,
  setFilters,
  toggleTopic,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  toggleTopic: (k: string) => void;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-eve-teal/15 bg-white p-4 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-eve-muted">Region</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip active={filters.region === "any"} onClick={() => setFilters((f) => ({ ...f, region: "any" }))}>
            Any
          </Chip>
          {REGIONS.map((r) => (
            <Chip
              key={r.key}
              active={filters.region === r.key}
              onClick={() => setFilters((f) => ({ ...f, region: r.key }))}
            >
              {r.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <LabeledInput
          label="Country"
          placeholder="e.g. Morocco, Brazil"
          value={filters.country}
          onChange={(v) => setFilters((f) => ({ ...f, country: v }))}
        />
        <LabeledInput
          label="City"
          placeholder="e.g. Casablanca"
          value={filters.city}
          onChange={(v) => setFilters((f) => ({ ...f, city: v }))}
        />
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-eve-muted">Format</p>
        <div className="mt-2 flex gap-1.5">
          {(["any", "online", "in_person"] as const).map((k) => (
            <Chip key={k} active={filters.online === k} onClick={() => setFilters((f) => ({ ...f, online: k }))}>
              {k === "any" ? "Any" : k === "online" ? "Online" : "In-person"}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-eve-muted">Language</p>
          <select
            value={filters.language}
            onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="pt">Portuguese</option>
            <option value="fr">French</option>
            <option value="ar">Arabic</option>
            <option value="sw">Swahili</option>
            <option value="ha">Hausa</option>
            <option value="yo">Yoruba</option>
            <option value="ht">Haitian Creole</option>
          </select>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-eve-muted">Life stage</p>
          <select
            value={filters.stage}
            onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {LIFE_STAGES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-eve-muted">Price</p>
        <div className="mt-2 flex gap-1.5">
          {(["any", "free", "paid"] as const).map((k) => (
            <Chip key={k} active={filters.price === k} onClick={() => setFilters((f) => ({ ...f, price: k }))}>
              {k === "any" ? "Any" : k === "free" ? "Free" : "Paid"}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-eve-muted">Topics</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TOPIC_TAGS.map((t) => (
            <Chip key={t.key} active={filters.topics.includes(t.key)} onClick={() => toggleTopic(t.key)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-medium border transition",
        active
          ? "bg-eve-teal text-white border-eve-teal"
          : "bg-white text-eve-muted border-eve-sand hover:border-eve-teal/40",
      )}
    >
      {children}
    </button>
  );
}

function LabeledInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-eve-muted">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
      />
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "Date to be confirmed";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date to be confirmed";
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventCard({ ev }: { ev: EventRow }) {
  const organizer = ev.vendors?.business_name ?? "Verified partner";
  const dateLabel = formatDate(ev.event_at);
  const loc = (ev.location ?? "").toLowerCase();
  const online = !ev.location || loc.includes("online") || loc.includes("virtual") || loc.includes("zoom");
  const isExternal = ev.cta_type === "register" && ev.cta_url;
  const cta = isExternal
    ? { href: ev.cta_url!, label: "View event", external: true as const }
    : { to: "/eve/events/$id" as const, params: { id: ev.id }, label: "View event", external: false as const };

  const matchedTopics = TOPIC_TAGS.filter((t) => {
    const hay = `${ev.title} ${ev.excerpt ?? ""} ${ev.category ?? ""}`.toLowerCase();
    return t.keywords.some((k) => hay.includes(k));
  }).slice(0, 3);

  return (
    <article className="rounded-2xl border border-eve-teal/15 bg-white p-4 shadow-sm">
      <h3 className="font-serif text-base font-semibold leading-snug text-eve-teal-dark">
        {ev.title}
      </h3>
      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-eve-teal">
        <Users className="h-3 w-3" /> Hosted by {organizer}
      </p>
      {ev.excerpt ? (
        <p className="mt-1.5 line-clamp-2 text-[13px] text-eve-muted">{ev.excerpt}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-eve-muted">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {dateLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {online ? "Online" : ev.location}
        </span>
        {ev.language ? (
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" /> {ev.language.toUpperCase()}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            /free|gratis|gratuit/i.test(ev.price_label ?? "")
              ? "bg-eve-forest/10 text-eve-forest"
              : "bg-eve-terra-light text-eve-terra",
          )}
        >
          {ev.price_label || "Price on registration"}
        </span>
        {ev.category ? (
          <span className="rounded-full bg-eve-teal-light px-2 py-0.5 text-[10px] font-medium text-eve-teal">
            {ev.category}
          </span>
        ) : null}
        {ev.life_stage ? (
          <span className="rounded-full bg-eve-rose-light px-2 py-0.5 text-[10px] font-medium text-eve-rose">
            {ev.life_stage}
          </span>
        ) : null}
        {matchedTopics.map((t) => (
          <span key={t.key} className="inline-flex items-center gap-1 rounded-full bg-eve-cream px-2 py-0.5 text-[10px] font-medium text-eve-muted">
            <Tag className="h-2.5 w-2.5" /> {t.label}
          </span>
        ))}
      </div>

      <div className="mt-3">
        {cta.external ? (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-eve-teal px-4 py-2 text-xs font-medium text-white"
          >
            {cta.label} <ArrowRight className="h-3 w-3" />
          </a>
        ) : (
          <Link
            to={cta.to}
            params={cta.params}
            className="inline-flex items-center gap-1 rounded-full bg-eve-teal px-4 py-2 text-xs font-medium text-white"
          >
            {cta.label} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </article>
  );
}
