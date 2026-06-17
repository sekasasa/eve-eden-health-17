import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Globe,
  MapPin,
  Share2,
  Bookmark,
  Tag,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { supabase } from "@/integrations/supabase/client";
import { eveToast } from "@/lib/eve-toast";

export const Route = createFileRoute("/eve/events/$id")({
  component: EventDetail,
});

type EventRow = {
  id: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  location: string | null;
  language: string | null;
  category: string | null;
  life_stage: string | null;
  event_at: string | null;
  cta_type: string | null;
  cta_url: string | null;
  media_url: string | null;
  tags: string[] | null;
  vendor_id: string;
  vendors?: { name: string | null; slug: string | null } | null;
};

function EventDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [ev, setEv] = useState<EventRow | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vendor_content")
        .select(
          "id,title,excerpt,body,location,language,category,life_stage,event_at,cta_type,cta_url,media_url,tags,vendor_id,vendors(name,slug)",
        )
        .eq("id", id)
        .eq("content_type", "event")
        .maybeSingle();
      setEv((data as unknown as EventRow) ?? null);
    })();
  }, [id]);

  if (ev === undefined) {
    return (
      <EveShell>
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-eve-cream/60" />
      </EveShell>
    );
  }

  if (ev === null) {
    return (
      <EveShell>
        <button
          onClick={() => nav({ to: "/eve/events" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back to events
        </button>
        <div className="mt-4 rounded-2xl border border-eve-teal/15 bg-white p-5">
          <h1 className="font-serif text-xl text-eve-teal-dark">Event not found</h1>
          <p className="mt-1 text-sm text-eve-muted">
            This event may have ended or been removed.
          </p>
        </div>
        <div className="mt-4">
          <NavigatorHelp />
        </div>
      </EveShell>
    );
  }

  const dateLabel = ev.event_at
    ? new Date(ev.event_at).toLocaleString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date to be confirmed";
  const organizer = ev.vendors?.name ?? "Verified partner";
  const isExternal = ev.cta_type === "register" && ev.cta_url;

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: ev!.title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        eveToast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <EveShell>
      <button
        onClick={() => nav({ to: "/eve/events" })}
        className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
      >
        <ArrowLeft className="h-3 w-3" /> Back to events
      </button>

      {ev.media_url ? (
        <div className="overflow-hidden rounded-2xl">
          <img
            src={ev.media_url}
            alt={ev.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-eve-teal-light to-eve-rose-light">
          <Calendar className="h-10 w-10 text-eve-teal" />
        </div>
      )}

      <h1 className="mt-4 font-serif text-2xl leading-tight text-eve-teal-dark">
        {ev.title}
      </h1>
      <p className="mt-1 text-[12px] text-eve-teal">Hosted by {organizer}</p>

      <div className="mt-3 space-y-1.5 text-[13px] text-eve-forest">
        <p className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4 text-eve-teal" /> {dateLabel}
        </p>
        <p className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4 text-eve-teal" /> {ev.location || "Online"}
        </p>
        {ev.language ? (
          <p className="inline-flex items-center gap-2">
            <Globe className="h-4 w-4 text-eve-teal" /> {ev.language.toUpperCase()}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ev.category ? (
          <span className="rounded-full bg-eve-teal-light px-2 py-0.5 text-[11px] font-medium text-eve-teal">
            {ev.category}
          </span>
        ) : null}
        {ev.life_stage ? (
          <span className="rounded-full bg-eve-rose-light px-2 py-0.5 text-[11px] font-medium text-eve-rose">
            {ev.life_stage}
          </span>
        ) : null}
        {(ev.tags ?? []).slice(0, 5).map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-eve-cream px-2 py-0.5 text-[11px] text-eve-muted"
          >
            <Tag className="h-2.5 w-2.5" /> {t}
          </span>
        ))}
      </div>

      {ev.excerpt ? (
        <p className="mt-4 text-[14px] leading-relaxed text-eve-forest">{ev.excerpt}</p>
      ) : null}

      {ev.body ? (
        <section className="mt-5">
          <h2 className="font-serif text-base text-eve-teal-dark">About this event</h2>
          <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-eve-forest">
            {ev.body}
          </p>
        </section>
      ) : null}

      <div className="mt-5 flex flex-col gap-2">
        {isExternal ? (
          <a
            href={ev.cta_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-full bg-eve-teal px-5 py-3 text-sm font-medium text-white"
          >
            Register for event <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <Link
            to="/eve/vendors/$id"
            params={{ id: ev.vendor_id }}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-eve-teal px-5 py-3 text-sm font-medium text-white"
          >
            View organizer profile <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={share}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-eve-teal/30 px-3 py-2 text-[12px] font-medium text-eve-teal-dark"
          >
            <Share2 className="h-3.5 w-3.5" /> Share event
          </button>
          <button
            onClick={() => {
              setSaved((s) => !s);
              eveToast.success(saved ? "Removed from saved" : "Event saved");
            }}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-eve-teal/30 px-3 py-2 text-[12px] font-medium text-eve-teal-dark"
          >
            <Bookmark className={"h-3.5 w-3.5 " + (saved ? "fill-current" : "")} />
            {saved ? "Saved" : "Save event"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/eve/vendors/$id"
          params={{ id: ev.vendor_id }}
          className="flex items-center justify-between rounded-2xl border border-eve-teal/15 bg-white p-4"
        >
          <div>
            <p className="text-[11px] uppercase tracking-wide text-eve-muted">Organizer</p>
            <p className="mt-0.5 font-serif text-sm text-eve-teal-dark">{organizer}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-eve-teal" />
        </Link>
      </div>

      <div className="mt-5">
        <NavigatorHelp
          label="Questions about this event?"
          sub="A navigator can help you decide if it's right for you or suggest alternatives."
        />
      </div>
    </EveShell>
  );
}
