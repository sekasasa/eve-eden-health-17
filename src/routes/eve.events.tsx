import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Globe, ArrowRight, Sparkles } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { supabase } from "@/integrations/supabase/client";
import { useCarePreferences } from "@/hooks/useCarePreferences";
import { priorityLanguagesForRegion, regionOf, prefHelpers } from "@/lib/personalization";

export const Route = createFileRoute("/eve/events")({
  component: EventsPage,
  head: () => ({
    meta: [
      { title: "Events & workshops — Eve & Eden" },
      {
        name: "description",
        content:
          "Upcoming maternal-health events, classes, and support groups from vetted providers and partners.",
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
};

function EventsPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const { prefs } = useCarePreferences();

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("vendor_content")
        .select(
          "id,title,excerpt,location,language,category,life_stage,event_at,cta_type,cta_url,media_url,price_label,vendor_id,vendors(business_name)",
        )
        .eq("content_type", "event")
        .eq("status", "published")
        .or(`event_at.gte.${nowIso},event_at.is.null`)
        .order("event_at", { ascending: true, nullsFirst: false })
        .limit(50);
      setEvents((data as unknown as EventRow[]) ?? []);
    })();
  }, []);

  const sorted = useMemo(() => {
    if (!events) return null;
    const region = regionOf(prefs);
    const regionalLangs = priorityLanguagesForRegion(region);
    const city = (prefs.city ?? "").toLowerCase();
    const country = (prefs.country ?? "").toLowerCase();
    const stage = prefs.stage ?? "";
    const wantsVirtual = prefs.care_setting === "virtual";
    const haystackBoost = (e: EventRow) => {
      const text = `${e.title} ${e.excerpt ?? ""} ${e.category ?? ""}`.toLowerCase();
      let s = 0;
      if (prefHelpers.ramadan(prefs) && text.includes("ramadan")) s += 4;
      if (prefHelpers.fasting(prefs) && text.includes("fasting")) s += 3;
      if (prefHelpers.vegan(prefs) && (text.includes("vegan") || text.includes("plant"))) s += 2;
      if (prefHelpers.vbac(prefs) && text.includes("vbac")) s += 3;
      if (prefHelpers.lowIntervention(prefs) && (text.includes("birth plan") || text.includes("natural"))) s += 2;
      if (prefHelpers.familyInvolved(prefs) && text.includes("family")) s += 1;
      return s;
    };
    const score = (e: EventRow) => {
      let s = 0;
      if (stage && e.life_stage === stage) s += 5;
      if (prefs.language && e.language && e.language.toLowerCase() === prefs.language.toLowerCase()) s += 4;
      else if (regionalLangs.length && e.language && regionalLangs.includes(e.language.toLowerCase())) s += 2;
      const loc = (e.location ?? "").toLowerCase();
      if (city && loc.includes(city)) s += 3;
      else if (country && loc.includes(country)) s += 2;
      if (wantsVirtual && (loc.includes("online") || loc.includes("virtual") || !e.location)) s += 2;
      s += haystackBoost(e);
      return s;
    };
    return [...events].sort((a, b) => score(b) - score(a));
  }, [events, prefs]);

  const personalized = !!(prefs.region || prefs.country || prefs.city || prefs.language || prefs.stage);

  return (
    <EveShell>
      <div className="pt-2">
        <h1 className="font-serif text-3xl text-eve-teal-dark">Events & Workshops</h1>
        <p className="mt-1 font-sans text-sm text-eve-muted">
          Classes, talks, wellness sessions, and community events for mothers and families.
        </p>
      </div>

      {events === null ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-eve-cream/60" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="mt-6 space-y-4">
          <EmptyState
            icon={Calendar}
            title="Events & workshops are coming soon"
            description="We're partnering with providers to bring you prenatal classes, support groups, and maternal care events. Check back soon."
          />
          <NavigatorHelp
            label="Looking for a class or support group?"
            sub="Ask a navigator — we'll help you find prenatal classes, support groups, or local maternal care events."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {events.map((e) => (
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
  const isExternal = ev.cta_type === "register" && ev.cta_url;
  const cta = isExternal
    ? { href: ev.cta_url!, label: "Register for event", external: true as const }
    : { to: "/eve/events/$id" as const, params: { id: ev.id }, label: "View event", external: false as const };

  return (
    <article className="rounded-2xl border border-eve-teal/15 bg-white p-4 shadow-sm">
      <h3 className="font-serif text-base font-semibold leading-snug text-eve-teal-dark">
        {ev.title}
      </h3>
      <p className="mt-1 text-[11px] text-eve-teal">Hosted by {organizer}</p>
      {ev.excerpt ? (
        <p className="mt-1.5 line-clamp-2 text-[13px] text-eve-muted">{ev.excerpt}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-eve-muted">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {dateLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {ev.location || "Online"}
        </span>
        {ev.language ? (
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" /> {ev.language.toUpperCase()}
          </span>
        ) : null}
      </div>
      {(ev.category || ev.life_stage || ev.price_label) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ev.price_label ? (
            <span className="rounded-full bg-eve-forest/10 px-2 py-0.5 text-[10px] font-medium text-eve-forest">
              {ev.price_label}
            </span>
          ) : null}
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
        </div>
      )}
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
