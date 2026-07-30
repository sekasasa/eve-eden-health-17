import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Info,
  MapPin,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { LAUNCH_EVENT } from "@/lib/launch-event";

export const Route = createFileRoute("/eve/events/launch-casablanca-2026")({
  component: LaunchEventPage,
  head: () => ({
    meta: [
      { title: "Eve & Eden Maternal Health Launch — Casablanca" },
      {
        name: "description",
        content:
          "Saturday, 5 September 2026 in Casablanca. An afternoon for expecting mothers, soon-to-be mothers, and women trying to conceive. Venue and speakers to be announced.",
      },
      { property: "og:title", content: "Eve & Eden Maternal Health Launch — Casablanca" },
      {
        property: "og:description",
        content:
          "Saturday, 5 September 2026, Casablanca. OB-GYNs, midwives, and nutritionists. Venue, time, and speakers to be announced.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function TBA({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-eve-sand px-2 py-0.5 text-[10px] font-medium text-eve-muted">
      TBA · {children}
    </span>
  );
}

function LaunchEventPage() {
  const nav = useNavigate();
  const e = LAUNCH_EVENT;

  return (
    <EveShell>
      <button
        onClick={() => nav({ to: "/eve/events" })}
        className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
      >
        <ArrowLeft className="h-3 w-3" /> Back to events
      </button>

      {/* Hero */}
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-eve-teal-light to-eve-rose-light">
        <Calendar className="h-10 w-10 text-eve-teal" />
      </div>

      <span className="mt-4 inline-block rounded-full bg-eve-teal px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wide text-white">
        Featured launch event
      </span>
      <h1 className="mt-2 font-serif text-2xl leading-tight text-eve-teal-dark">{e.title}</h1>
      <p className="mt-2 font-sans text-sm text-eve-muted">{e.tagline}</p>

      {/* Key facts */}
      <section className="mt-4 space-y-2 rounded-2xl border border-eve-teal/15 bg-white p-4">
        <Row icon={<Calendar className="h-4 w-4 text-eve-teal" />} label={e.dateLabel} />
        <Row icon={<Clock className="h-4 w-4 text-eve-teal" />} label={e.timeLabel} />
        <Row
          icon={<MapPin className="h-4 w-4 text-eve-teal" />}
          label={`${e.city}, ${e.country}`}
          extra={<TBA>Venue</TBA>}
        />
        <Row
          icon={<Ticket className="h-4 w-4 text-eve-teal" />}
          label={`${e.priceLabel} · Hosted by ${e.host}`}
        />
        <Row
          icon={<Users className="h-4 w-4 text-eve-teal" />}
          label={e.capacityLabel}
          extra={<TBA>Capacity</TBA>}
        />
        <Row icon={<Globe className="h-4 w-4 text-eve-teal" />} label={e.languages.join(" · ")} />
      </section>

      {/* Registration */}
      <section className="mt-4 rounded-2xl border border-eve-sand bg-eve-cream/50 p-4">
        <p className="font-sans text-sm font-medium text-eve-teal-dark">Registration</p>
        <p className="mt-1 font-sans text-[12px] text-eve-muted">
          Registration is not open yet, so we cannot confirm a place for you today.{" "}
          {e.registrationDeadlineLabel}.
        </p>
        <button
          disabled
          className="mt-3 w-full cursor-not-allowed rounded-full bg-eve-muted/30 px-4 py-3 font-sans text-sm font-medium text-eve-muted"
        >
          Registration opens soon
        </button>
        <p className="mt-2 text-center font-sans text-[11px] text-eve-muted">
          Want to be told when it opens?{" "}
          <Link to="/eve/ask" className="font-medium text-eve-teal underline">
            Ask a navigator
          </Link>
        </p>
      </section>

      {/* Who it's for */}
      <Section title="Who this is for">
        <ul className="space-y-1.5">
          {e.audience.map((a) => (
            <li key={a} className="font-sans text-[13px] text-eve-muted">
              • {a}
            </li>
          ))}
        </ul>
      </Section>

      {/* Speakers */}
      <Section title="Speakers">
        <p className="font-sans text-[12px] text-eve-muted">
          We are confirming speakers now. Below are the professional categories taking part — no
          individual names are confirmed yet.
        </p>
        <div className="mt-3 space-y-2">
          {e.speakerCategories.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between rounded-xl border border-eve-sand bg-white px-3 py-2"
            >
              <span className="font-sans text-[13px] font-medium text-eve-teal-dark">
                {s.label}
              </span>
              <TBA>{s.note}</TBA>
            </div>
          ))}
        </div>
      </Section>

      {/* Agenda */}
      <Section title="Agenda">
        <ul className="space-y-2">
          {e.agenda.map((a) => (
            <li key={a.title} className="flex gap-3">
              <span className="w-12 shrink-0 font-sans text-[11px] text-eve-muted">{a.time}</span>
              <span className="font-sans text-[13px] text-eve-teal-dark">{a.title}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 font-sans text-[11px] text-eve-muted">
          Exact session times will be published with the final schedule.
        </p>
      </Section>

      {/* Learnings */}
      <Section title="What you'll take away">
        <ul className="space-y-1.5">
          {e.learnings.map((l) => (
            <li key={l} className="font-sans text-[13px] text-eve-muted">
              • {l}
            </li>
          ))}
        </ul>
      </Section>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-eve-rose/30 bg-eve-rose-light p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-eve-rose" />
        <p className="font-sans text-[11px] text-eve-rose">{e.safetyNote}</p>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-eve-sand bg-white p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-eve-muted" />
        <p className="font-sans text-[11px] text-eve-muted">
          Anything marked TBA is genuinely not decided yet. We would rather say so than publish a
          detail we cannot stand behind.
        </p>
      </div>

      <div className="mt-6">
        <NavigatorHelp />
      </div>
    </EveShell>
  );
}

function Row({
  icon,
  label,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-sans text-[13px] text-eve-teal-dark">{label}</span>
      {extra}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="font-serif text-lg text-eve-teal-dark">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
