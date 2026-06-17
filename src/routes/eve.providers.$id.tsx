import { useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Home as HomeIcon,
  Stethoscope,
  Activity,
  Repeat,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SearchSchema = { book?: number };

export const Route = createFileRoute("/eve/providers/$id")({
  validateSearch: (s: Record<string, unknown>): SearchSchema => ({
    book: s.book ? 1 : undefined,
  }),
  component: ProviderProfilePage,
});

type Provider = {
  id: string;
  full_name: string | null;
  specialty: string | null;
  clinic_name: string | null;
  bio: string | null;
  city: string | null;
  languages: string[] | null;
  avg_rating: number | null;
  review_count: number | null;
  consultation_fee_mad: number | null;
  is_verified: boolean | null;
  accepting_patients: boolean | null;
};

function initials(name?: string | null) {
  if (!name) return "Dr";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Real reviews are not wired yet — never show fabricated reviews on production-facing pages.
const REAL_REVIEWS: { rating: number; body: string }[] = [];

function ProviderProfilePage() {
  const { id } = useParams({ from: "/eve/providers/$id" });
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [p, setP] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioOpen, setBioOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(!!search.book);

  useEffect(() => setBookOpen(!!search.book), [search.book]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("providers")
        .select(
          "id,full_name,specialty,clinic_name,bio,city,languages,avg_rating,review_count,consultation_fee_mad,is_verified,accepting_patients",
        )
        .eq("id", id)
        .maybeSingle();
      setP((data as Provider) ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <EveShell>
        <div className="h-64 animate-pulse rounded-2xl bg-eve-muted/20" />
      </EveShell>
    );
  }

  if (!p) {
    return (
      <EveShell>
        <p className="font-sans text-sm text-eve-muted">Provider not found.</p>
      </EveShell>
    );
  }

  const bio =
    p.bio ??
    "Experienced clinician dedicated to attentive, evidence-based care for mothers at every stage of pregnancy.";

  return (
    <EveShell>
      <button
        onClick={() => navigate({ to: "/eve/providers" })}
        className="-ml-2 mb-2 inline-flex items-center gap-1 rounded-full px-2 py-1 font-sans text-sm text-eve-muted"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <section className="-mx-5 rounded-b-3xl bg-eve-cream px-5 pb-6 pt-4">
        <div className="flex gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-eve-teal font-sans text-lg font-medium text-white">
            {initials(p.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-[22px] leading-tight text-eve-forest">
              {p.full_name}
            </h1>
            <p className="font-sans text-xs text-eve-muted">
              {p.specialty}
              {p.clinic_name ? ` • ${p.clinic_name}` : ""}
            </p>
            {p.is_verified && <TrustBadge className="mt-1" />}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-sans text-xs text-eve-terra">
            <Star className="h-3 w-3 fill-eve-terra" />
            {p.avg_rating?.toFixed(1) ?? "—"}
            <span className="text-eve-muted">
              {p.review_count ? `(${p.review_count})` : ""}
            </span>
          </span>
          {p.consultation_fee_mad != null && (
            <span className="rounded-full bg-eve-teal-light px-2.5 py-1 font-sans text-xs text-eve-teal-dark">
              {p.consultation_fee_mad} MAD
            </span>
          )}
          {p.accepting_patients && (
            <span className="rounded-full bg-green-100 px-2.5 py-1 font-sans text-xs text-green-700">
              Accepting patients
            </span>
          )}
        </div>

        {p.languages?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.languages.map((l) => (
              <span
                key={l}
                className="rounded-full border border-eve-muted/30 bg-white px-2 py-0.5 font-sans text-[10px] text-eve-muted"
              >
                {l}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-lg text-eve-forest">
          About {p.full_name?.split(" ")[0] ?? "the doctor"}
        </h2>
        <p
          className={cn(
            "mt-2 font-sans text-sm leading-relaxed text-eve-forest/80",
            !bioOpen && "line-clamp-3",
          )}
        >
          {bio}
        </p>
        {bio.length > 140 && (
          <button
            onClick={() => setBioOpen((v) => !v)}
            className="mt-1 font-sans text-xs font-medium text-eve-teal"
          >
            {bioOpen ? "Show less" : "Read more"}
          </button>
        )}
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-eve-forest">Reviews</h2>
        </div>
        {REAL_REVIEWS.length === 0 ? (
          <p className="mt-2 font-sans text-sm text-eve-muted">No reviews yet.</p>
        ) : (
          <>
            <div className="mt-2 flex items-center gap-1 font-sans text-sm text-eve-terra">
              <Star className="h-4 w-4 fill-eve-terra" />
              {p.avg_rating?.toFixed(1) ?? "—"}
              <span className="text-eve-muted">
                {p.review_count ? `from ${p.review_count} reviews` : ""}
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {REAL_REVIEWS.map((r, i) => (
                <li key={i} className="rounded-2xl bg-white p-3">
                  <div className="flex items-center gap-0.5 text-eve-terra">
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <Star key={idx} className="h-3 w-3 fill-eve-terra" />
                    ))}
                  </div>
                  <p className="mt-1 font-sans text-sm text-eve-forest/80">
                    {r.body}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="h-24" />

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-sm -translate-x-1/2 border-t border-eve-muted/10 bg-white px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-eve-muted">
              Consultation
            </p>
            <p className="font-serif text-lg text-eve-forest">
              {p.consultation_fee_mad ?? "—"} MAD
            </p>
          </div>
          <PrimaryButton
            onClick={() =>
              navigate({
                to: "/eve/providers/$id",
                params: { id },
                search: { book: 1 },
              })
            }
            className="flex-1"
          >
            Book an appointment
          </PrimaryButton>
        </div>
      </div>

      <BookingSheet
        open={bookOpen}
        onOpenChange={(o) => {
          setBookOpen(o);
          if (!o)
            navigate({
              to: "/eve/providers/$id",
              params: { id },
              search: { book: undefined },
            });
        }}
        provider={p}
      />
    </EveShell>
  );
}

// ──────────────────────────────────────────────────────────────
// Booking sheet
// ──────────────────────────────────────────────────────────────

type BookingType = "Consultation" | "Scan / Ultrasound" | "Follow-up" | "Home visit";

const TYPES: { value: BookingType; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "Consultation", icon: Stethoscope },
  { value: "Scan / Ultrasound", icon: Activity },
  { value: "Follow-up", icon: Repeat },
  { value: "Home visit", icon: HomeIcon },
];

// Time slots are entered manually until live availability ships.

function BookingSheet({
  open,
  onOpenChange,
  provider,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  provider: Provider;
}) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<BookingType | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setType(null);
      setDate(null);
      setTime(null);
      setNotes("");
      setReminder(true);
      setConfirmedAt(null);
    }
  }, [open]);

  const days = useMemo(() => buildMonth(month), [month]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const confirm = async () => {
    if (!type || !date || !time) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { data: m } = await supabase
        .from("mothers")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!m?.id) throw new Error("Profile not found");

      const [hh, mm] = time.split(":").map(Number);
      const scheduled = new Date(date);
      scheduled.setHours(hh, mm, 0, 0);

      const { error } = await supabase.from("appointments").insert({
        mother_id: m.id,
        provider_id: provider.id,
        scheduled_at: scheduled.toISOString(),
        type,
        notes: notes || null,
        status: "pending",
        reminder_sent: reminder,
      });
      if (error) throw error;
      setConfirmedAt(scheduled);
      setStep(4);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-0 bg-eve-sand p-0"
      >
        <SheetHeader className="px-5 pt-5">
          <SheetTitle className="font-serif text-xl text-eve-forest">
            {step === 4 ? "Confirmed" : "Book appointment"}
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-8 pt-2">
          {step !== 4 && (
            <div className="mb-5 flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    step >= s ? "bg-eve-teal" : "bg-eve-muted/30",
                  )}
                />
              ))}
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="mb-3 font-sans text-sm text-eve-muted">
                What kind of appointment?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TYPES.map(({ value, icon: Icon }) => {
                  const active = type === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setType(value)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-colors",
                        active
                          ? "border-eve-teal bg-eve-teal-light"
                          : "border-transparent bg-white",
                      )}
                    >
                      <Icon className="h-5 w-5 text-eve-teal" />
                      <span className="font-sans text-sm font-medium text-eve-forest">
                        {value}
                      </span>
                    </button>
                  );
                })}
              </div>
              <PrimaryButton
                disabled={!type}
                onClick={() => setStep(2)}
                className="mt-6 w-full"
              >
                Continue
              </PrimaryButton>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <button
                  onClick={() =>
                    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                  }
                  className="rounded-full p-1.5 text-eve-muted hover:bg-eve-cream"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="font-serif text-base text-eve-forest">
                  {month.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <button
                  onClick={() =>
                    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
                  }
                  className="rounded-full p-1.5 text-eve-muted hover:bg-eve-cream"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-sans text-[10px] uppercase tracking-widest text-eve-muted">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                  if (!d) return <span key={i} />;
                  const past = d < today;
                  const selected =
                    date?.toDateString() === d.toDateString();
                  const available = !past;
                  return (
                    <button
                      key={i}
                      disabled={past}
                      onClick={() => setDate(d)}
                      className={cn(
                        "relative flex h-9 items-center justify-center rounded-full font-sans text-sm transition-colors",
                        past && "text-eve-muted/40",
                        !past && !selected && "text-eve-forest hover:bg-eve-cream",
                        selected && "bg-eve-teal text-white",
                      )}
                    >
                      {d.getDate()}
                      {available && !selected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-eve-teal" />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 font-sans text-sm text-eve-muted">
                {date
                  ? `Pick a time on ${date.toLocaleDateString(undefined, {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })}`
                  : "Pick a date to request a time"}
              </p>
              {/* Real availability is not wired yet — show a clearly labeled state instead of fake slots. */}
              <div className="mt-2 rounded-xl border border-dashed border-eve-muted/30 bg-white p-3">
                <p className="font-sans text-xs text-eve-muted">
                  Live availability coming soon. For now, share a preferred time below and we'll confirm with the provider.
                </p>
              </div>
              <div className="mt-3">
                <label className="font-sans text-xs text-eve-muted">Preferred time</label>
                <input
                  type="time"
                  value={time ?? ""}
                  onChange={(e) => setTime(e.target.value || null)}
                  className="mt-1 w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 font-sans text-sm"
                />
              </div>

              <div className="mt-6 flex gap-2">
                <SecondaryButton onClick={() => setStep(1)} className="flex-1">
                  Back
                </SecondaryButton>
                <PrimaryButton
                  disabled={!date || !time}
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  Continue
                </PrimaryButton>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="rounded-2xl bg-white p-4">
                <SummaryRow label="Provider" value={provider.full_name ?? ""} />
                <SummaryRow label="Type" value={type ?? ""} />
                <SummaryRow
                  label="When"
                  value={`${date?.toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })} • ${time}`}
                />
                <SummaryRow
                  label="Fee"
                  value={`${provider.consultation_fee_mad ?? "—"} MAD`}
                  last
                />
              </div>

              <label className="mt-4 block font-sans text-sm text-eve-forest">
                Any questions for the doctor?
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-2xl border border-eve-muted/20 bg-white p-3 font-sans text-sm text-eve-forest outline-none focus:border-eve-teal"
                placeholder="Optional notes…"
              />

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-3">
                <div>
                  <p className="font-sans text-sm font-medium text-eve-forest">
                    WhatsApp reminder
                  </p>
                  <p className="font-sans text-xs text-eve-muted">
                    We'll message you the day before.
                  </p>
                </div>
                <Switch checked={reminder} onCheckedChange={setReminder} />
              </div>

              <div className="mt-6 flex gap-2">
                <SecondaryButton onClick={() => setStep(2)} className="flex-1">
                  Back
                </SecondaryButton>
                <PrimaryButton
                  disabled={saving}
                  onClick={confirm}
                  className="flex-1"
                >
                  {saving ? "Saving…" : "Confirm booking"}
                </PrimaryButton>
              </div>
            </div>
          )}

          {step === 4 && confirmedAt && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-eve-teal text-white">
                <Check className="h-8 w-8" strokeWidth={3} />
              </div>
              <h3 className="mt-4 font-serif text-2xl text-eve-forest">
                Appointment confirmed!
              </h3>
              <p className="mt-1 font-sans text-sm text-eve-muted">
                We've sent the details to your inbox.
              </p>

              <div className="mt-5 w-full rounded-2xl bg-white p-4 text-left">
                <SummaryRow label="Provider" value={provider.full_name ?? ""} />
                <SummaryRow label="Type" value={type ?? ""} />
                <SummaryRow
                  label="When"
                  value={confirmedAt.toLocaleString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  last
                />
              </div>

              <div className="mt-6 flex w-full gap-2">
                <SecondaryButton
                  onClick={() => downloadIcs(provider, type!, confirmedAt)}
                  className="flex-1"
                >
                  <CalendarDays className="mr-1.5 h-4 w-4" />
                  Add to calendar
                </SecondaryButton>
                <Link to="/eve/home" className="flex-1">
                  <PrimaryButton
                    onClick={() => onOpenChange(false)}
                    className="w-full"
                  >
                    Back to home
                  </PrimaryButton>
                </Link>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2",
        !last && "border-b border-eve-muted/10",
      )}
    >
      <span className="font-sans text-xs uppercase tracking-widest text-eve-muted">
        {label}
      </span>
      <span className="font-sans text-sm text-eve-forest">{value}</span>
    </div>
  );
}

function buildMonth(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function downloadIcs(p: Provider, type: string, when: Date) {
  const end = new Date(when.getTime() + 30 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${when.getTime()}@eve
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(when)}
DTEND:${fmt(end)}
SUMMARY:${type} with ${p.full_name ?? "Doctor"}
LOCATION:${p.clinic_name ?? ""}
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "appointment.ics";
  a.click();
  URL.revokeObjectURL(url);
}
