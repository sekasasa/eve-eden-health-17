import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, RefreshCw, X, Check, Calendar as CalIcon, Baby, Heart, Star } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/appointments")({
  component: EveAppointments,
});

type Appt = {
  id: string;
  status: string | null;
  type: string | null;
  notes: string | null;
  scheduled_at: string;
  reminder_sent: boolean | null;
  provider: { full_name: string | null; clinic_name: string | null; city: string | null } | null;
};

type Milestone = { week: number; label: string; icon: typeof Baby };
const MILESTONES: Milestone[] = [
  { week: 12, label: "First trimester scan", icon: Baby },
  { week: 20, label: "Anatomy scan", icon: Heart },
  { week: 36, label: "Final check-up", icon: Check },
  { week: 40, label: "Due date", icon: CalIcon },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EveAppointments() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [week, setWeek] = useState<number>(0);
  const [doneMilestones, setDoneMilestones] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: mother } = await supabase
        .from("mothers")
        .select("id, pregnancy_week")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!mother) {
        setLoading(false);
        return;
      }
      setWeek(mother.pregnancy_week ?? 0);
      const { data } = await supabase
        .from("appointments")
        .select(
          "id,status,type,notes,scheduled_at,reminder_sent,provider:providers(full_name,clinic_name,city)",
        )
        .eq("mother_id", mother.id)
        .order("scheduled_at", { ascending: true });
      setAppts((data as unknown as Appt[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const now = Date.now();
  const upcoming = appts.filter(
    (a) =>
      (a.status === "pending" || a.status === "confirmed") &&
      new Date(a.scheduled_at).getTime() > now,
  );
  const past = appts.filter(
    (a) =>
      !(
        (a.status === "pending" || a.status === "confirmed") &&
        new Date(a.scheduled_at).getTime() > now
      ),
  );

  async function cancel(id: string) {
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    setAppts((xs) => xs.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
  }
  async function toggleReminder(a: Appt, v: boolean) {
    setAppts((xs) => xs.map((x) => (x.id === a.id ? { ...x, reminder_sent: v } : x)));
    await supabase.from("appointments").update({ reminder_sent: v }).eq("id", a.id);
  }

  return (
    <EveShell>
      <div className="pt-2">
        <SectionLabel>My care</SectionLabel>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">My care timeline</h1>
      </div>

      <section className="mt-6">
        <SectionLabel>Upcoming</SectionLabel>
        {loading ? (
          <div className="mt-3 h-32 animate-pulse rounded-2xl bg-eve-muted/20" />
        ) : upcoming.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-eve-muted">No upcoming visits.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {upcoming.map((a) => (
              <ApptCard key={a.id} a={a} onCancel={() => cancel(a.id)} onToggle={(v) => toggleReminder(a, v)} />
            ))}
          </div>
        )}

        <Link to="/eve/providers" className="mt-4 block">
          <PrimaryButton className="w-full">+ Book a new appointment</PrimaryButton>
        </Link>
      </section>

      {past.length > 0 && (
        <section className="mt-8">
          <Accordion type="single" collapsible>
            <AccordionItem value="past" className="border-none">
              <AccordionTrigger className="font-sans text-xs uppercase tracking-widest text-eve-muted hover:no-underline">
                Past appointments ({past.length})
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                {past.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl bg-white/60 p-3 opacity-80"
                  >
                    <p className="font-sans text-[13px] font-medium text-eve-teal-dark">
                      {fmtDate(a.scheduled_at)}
                    </p>
                    <p className="font-sans text-xs text-eve-muted">
                      {a.type ?? "Visit"} · {a.provider?.full_name ?? "Provider"}
                    </p>
                    {a.status === "completed" && (
                      <button className="mt-2 inline-flex items-center gap-1 font-sans text-[11px] text-eve-teal">
                        <Star className="h-3 w-3" /> Leave a review
                      </button>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      )}

      <section className="mt-10">
        <SectionLabel>Care milestones</SectionLabel>
        <ol className="relative mt-4 ml-3 border-l-2 border-eve-teal-light pl-5">
          {MILESTONES.map((m) => {
            const reached = week >= m.week;
            const Icon = m.icon;
            return (
              <li key={m.week} className="relative mb-5 last:mb-0">
                <span
                  className={cn(
                    "absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full",
                    reached ? "bg-eve-teal text-white" : "bg-white text-eve-muted ring-1 ring-eve-muted/30",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-sans text-[13px] font-medium text-eve-teal-dark">
                      {m.label}
                    </p>
                    <p className="font-sans text-[11px] text-eve-muted">Week {m.week}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-eve-teal"
                    checked={!!doneMilestones[m.week]}
                    onChange={(e) =>
                      setDoneMilestones((d) => ({ ...d, [m.week]: e.target.checked }))
                    }
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </EveShell>
  );
}

function ApptCard({
  a,
  onCancel,
  onToggle,
}: {
  a: Appt;
  onCancel: () => void;
  onToggle: (v: boolean) => void;
}) {
  const confirmed = a.status === "confirmed";
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 font-sans text-[10px] uppercase tracking-wide text-white",
            confirmed ? "bg-eve-teal" : "bg-eve-terra",
          )}
        >
          {confirmed ? "Confirmed" : "Pending"}
        </span>
        <span className="font-sans text-[11px] text-eve-muted">
          {a.provider?.city ?? ""}
        </span>
      </div>
      <p className="mt-2 font-sans text-[14px] font-medium text-eve-teal-dark">
        {fmtDate(a.scheduled_at)}
      </p>
      <p className="font-sans text-xs text-eve-muted">
        {a.type ?? "Consultation"} · {a.provider?.full_name ?? "Provider"}
        {a.provider?.clinic_name ? ` · ${a.provider.clinic_name}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <GhostBtn icon={MapPin}>Get directions</GhostBtn>
        <GhostBtn icon={RefreshCw}>Reschedule</GhostBtn>
        <GhostBtn icon={X} onClick={onCancel}>
          Cancel
        </GhostBtn>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-eve-muted/10 pt-3">
        <span className="font-sans text-[11px] text-eve-muted">WhatsApp reminder</span>
        <Switch checked={!!a.reminder_sent} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}

function GhostBtn({
  icon: Icon,
  children,
  onClick,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] text-eve-teal hover:bg-eve-teal-light/40"
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}
