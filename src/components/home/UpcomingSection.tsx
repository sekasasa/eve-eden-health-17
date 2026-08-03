import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useUpcoming } from "@/hooks/useUpcoming";
import { flagOffCopy, isFeatureEnabled } from "@/lib/flags";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Real appointments + published events. Registration respects its flag. */
export function UpcomingSection({ lang }: { lang: "en" | "fr" | "ar" }) {
  const { appointments, events, loading } = useUpcoming(3);
  const registrationOn = isFeatureEnabled("eventRegistration");

  const copy = {
    en: {
      label: "Upcoming",
      empty: "Nothing scheduled yet",
      emptyBody: "Appointments you book and events you join will show up here.",
      events: "Browse events",
      appts: "All appointments",
    },
    fr: {
      label: "À venir",
      empty: "Rien de prévu",
      emptyBody: "Vos rendez-vous et événements apparaîtront ici.",
      events: "Voir les événements",
      appts: "Tous les rendez-vous",
    },
    ar: {
      label: "القادم",
      empty: "لا شيء مجدول بعد",
      emptyBody: "ستظهر هنا مواعيدك والفعاليات التي تنضمين إليها.",
      events: "تصفحي الفعاليات",
      appts: "كل المواعيد",
    },
  }[lang];

  const isEmpty = !loading && appointments.length === 0 && events.length === 0;

  return (
    <section className="mt-5 px-3 rtl:text-right">
      <SectionLabel>{copy.label}</SectionLabel>
      {loading ? (
        <div className="mt-2 h-16 w-full animate-pulse rounded-2xl bg-eve-muted/20" />
      ) : isEmpty ? (
        <div className="mt-2 rounded-2xl border border-dashed border-eve-sand bg-white p-4">
          <p className="font-sans text-[15px] font-semibold text-eve-teal-dark">{copy.empty}</p>
          <p className="mt-1 font-sans text-[13px] text-eve-teal-dark/70">{copy.emptyBody}</p>
          <Link
            to="/eve/events"
            className="mt-2 inline-block font-sans text-[13px] font-medium text-eve-teal"
          >
            {copy.events}
          </Link>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {appointments.map((a) => (
            <Link
              key={a.id}
              to="/eve/appointments"
              className="flex items-start gap-3 rounded-2xl border border-eve-sand bg-white p-3 rtl:flex-row-reverse rtl:text-right"
            >
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-eve-teal" />
              <span className="min-w-0">
                <span className="block font-sans text-[14px] font-semibold text-eve-teal-dark">
                  {a.providerName ?? a.type ?? "Appointment"}
                </span>
                <span className="block font-sans text-[13px] text-eve-teal-dark/70">
                  {fmt(a.scheduled_at)}
                </span>
              </span>
            </Link>
          ))}
          {events.map((e) => (
            <Link
              key={e.id}
              to="/eve/events/$id"
              params={{ id: e.id }}
              className="flex items-start gap-3 rounded-2xl border border-eve-sand bg-white p-3 rtl:flex-row-reverse rtl:text-right"
            >
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-eve-rose" />
              <span className="min-w-0">
                <span className="block font-sans text-[14px] font-semibold text-eve-teal-dark">
                  {e.title}
                </span>
                <span className="block font-sans text-[13px] text-eve-teal-dark/70">
                  {e.event_at ? fmt(e.event_at) : "Date to be announced"}
                </span>
                {e.location && (
                  <span className="mt-0.5 inline-flex items-center gap-1 font-sans text-[12px] text-eve-teal-dark/70">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
      {!registrationOn && events.length > 0 && (
        <p role="note" className="mt-2 font-sans text-[12px] text-eve-teal-dark/70">
          {flagOffCopy("eventRegistration")}
        </p>
      )}
    </section>
  );
}
