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
  Clock,
  Users,
  ShieldCheck,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { supabase } from "@/integrations/supabase/client";
import { eveToast } from "@/lib/eve-toast";

export const Route = createFileRoute("/eve/events/$id")({
  component: EventDetail,
});

type Speaker = {
  name: string;
  photo?: string | null;
  role?: string | null;
  specialty?: string | null;
  organization?: string | null;
  city?: string | null;
  bio?: string | null;
  session?: string | null;
  languages?: string[] | null;
  profile_url?: string | null;
  placeholder?: boolean;
};

type AgendaItem = { time?: string | null; title?: string | null };

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
  speakers: Speaker[] | null;
  agenda: AgendaItem[] | null;
  safety_note: string | null;
  price_label: string | null;
  vendor_id: string;
  vendors?: { business_name: string | null } | null;
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
          "id,title,excerpt,body,location,language,category,life_stage,event_at,cta_type,cta_url,media_url,tags,speakers,agenda,safety_note,price_label,vendor_id,vendors(business_name)",
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
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date to be confirmed";
  const organizer = ev.vendors?.business_name ?? "Verified partner";
  const isExternal = ev.cta_type === "register" && ev.cta_url;

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const n = typeof navigator !== "undefined" ? (navigator as Navigator) : null;
    try {
      if (n && typeof (n as Navigator & { share?: unknown }).share === "function") {
        await (n as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: ev!.title,
          url,
        });
      } else if (n?.clipboard) {
        await n.clipboard.writeText(url);
        eveToast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  }

  function reserve() {
    if (isExternal) return;
    eveToast.info(
      "Registration is opening soon. Ask a navigator if you would like to be notified.",
    );
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
        {ev.price_label ? (
          <span className="rounded-full bg-eve-forest/10 px-2 py-0.5 text-[11px] font-medium text-eve-forest">
            {ev.price_label}
          </span>
        ) : null}
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

      {Array.isArray(ev.speakers) && ev.speakers.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-serif text-base text-eve-teal-dark">Speakers</h2>
          <div className="mt-2 space-y-2">
            {ev.speakers.map((s, i) => (
              <SpeakerCard key={i} speaker={s} />
            ))}
          </div>
        </section>
      ) : null}

      {Array.isArray(ev.agenda) && ev.agenda.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-serif text-base text-eve-teal-dark">Agenda</h2>
          <ol className="mt-2 space-y-1 rounded-2xl border border-eve-teal/15 bg-white p-3">
            {ev.agenda.map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border-b border-eve-cream/70 py-1.5 last:border-b-0"
              >
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-eve-teal">
                  <Clock className="h-3 w-3" />
                  {a.time ?? ""}
                </span>
                <span className="text-[13px] text-eve-forest">{a.title}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {ev.safety_note ? (
        <section className="mt-5 rounded-2xl border border-eve-teal/15 bg-eve-cream/50 p-3">
          <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-eve-teal">
            <ShieldCheck className="h-3 w-3" /> Safety note
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-eve-muted">{ev.safety_note}</p>
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
            Reserve my spot <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <button
            onClick={reserve}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-eve-teal px-5 py-3 text-sm font-medium text-white"
          >
            Reserve my spot <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {!isExternal && (
          <p className="text-center text-[11px] text-eve-muted">
            Registration is opening soon. Ask a navigator to be notified.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={share}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-eve-teal/30 px-3 py-2 text-[12px] font-medium text-eve-teal-dark"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button
            onClick={() => {
              setSaved((s) => !s);
              eveToast.success(saved ? "Removed from saved" : "Event saved");
            }}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-eve-teal/30 px-3 py-2 text-[12px] font-medium text-eve-teal-dark"
          >
            <Bookmark className={"h-3.5 w-3.5 " + (saved ? "fill-current" : "")} />
            {saved ? "Saved" : "Save"}
          </button>
          <Link
            to="/eve/vendors/$id"
            params={{ id: ev.vendor_id }}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-eve-teal/30 px-3 py-2 text-[12px] font-medium text-eve-teal-dark"
          >
            <Users className="h-3.5 w-3.5" /> Host
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <NavigatorHelp
          label="Questions about this event?"
          sub="A navigator can help you decide if it's right for you or notify you when registration opens."
        />
      </div>
    </EveShell>
  );
}

function SpeakerCard({ speaker }: { speaker: Speaker }) {
  const initials = (speaker.name ?? "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-eve-teal/15 bg-white p-3">
      {speaker.photo ? (
        <img
          src={speaker.photo}
          alt={speaker.name}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-eve-cream text-sm font-semibold text-eve-teal">
          {initials || "?"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm font-semibold text-eve-teal-dark">
          {speaker.name}
          {speaker.placeholder ? (
            <span className="ml-2 rounded-full bg-eve-cream px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-eve-muted">
              To be announced
            </span>
          ) : null}
        </p>
        {speaker.role || speaker.specialty ? (
          <p className="text-[11px] text-eve-teal">
            {[speaker.role, speaker.specialty].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {speaker.organization || speaker.city ? (
          <p className="text-[11px] text-eve-muted">
            {[speaker.organization, speaker.city].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {speaker.session ? (
          <p className="mt-1 text-[12px] text-eve-forest">Session: {speaker.session}</p>
        ) : null}
        {speaker.bio ? (
          <p className="mt-1 text-[12px] leading-snug text-eve-muted">{speaker.bio}</p>
        ) : null}
        {Array.isArray(speaker.languages) && speaker.languages.length > 0 ? (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-eve-muted">
            {speaker.languages.join(" · ")}
          </p>
        ) : null}
        {speaker.profile_url ? (
          <a
            href={speaker.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-eve-teal"
          >
            View profile <ArrowRight className="h-3 w-3" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
