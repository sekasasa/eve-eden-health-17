import { Fragment, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

export const Route = createFileRoute("/eden/appointments")({
  component: EdenAppointments,
});

type Appt = {
  id: string;
  scheduled_at: string;
  status: string | null;
  type: string | null;
  notes: string | null;
  mother_id: string;
  mother: { id: string; full_name: string | null; pregnancy_week: number | null; phone: string | null } | null;
};

type Mother = { id: string; full_name: string | null; phone: string | null; pregnancy_week: number | null };

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-eve-teal text-white border-eve-teal-dark",
  pending: "bg-amber-200 text-amber-900 border-amber-400",
  completed: "bg-gray-200 text-gray-700 border-gray-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 8..18
const FILTERS = ["All", "Pending", "Confirmed", "Today"] as const;

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function EdenAppointments() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [view, setView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [monthCursor, setMonthCursor] = useState<Date>(() => new Date());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [selected, setSelected] = useState<Appt | null>(null);
  const [newSlot, setNewSlot] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: p } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!p) return;
      setProviderId(p.id);
      const { data } = await supabase
        .from("appointments")
        .select("id,scheduled_at,status,type,notes,mother_id,mother:mothers(id,full_name,pregnancy_week,phone)")
        .eq("provider_id", p.id)
        .order("scheduled_at", { ascending: true });
      setAppts((data as unknown as Appt[]) ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const sod = new Date(now); sod.setHours(0, 0, 0, 0);
    const eod = addDays(sod, 1);
    return appts.filter((a) => {
      if (filter === "Pending") return a.status === "pending";
      if (filter === "Confirmed") return a.status === "confirmed";
      if (filter === "Today") {
        const d = new Date(a.scheduled_at);
        return d >= sod && d < eod;
      }
      return true;
    });
  }, [appts, filter]);

  function exportCsv() {
    const ws = weekStart;
    const we = addDays(ws, 7);
    const rows = filtered.filter((a) => {
      const d = new Date(a.scheduled_at);
      return d >= ws && d < we;
    });
    const header = ["Date", "Time", "Patient", "Phone", "Type", "Status", "Notes"];
    const lines = [header.join(",")];
    for (const a of rows) {
      const d = new Date(a.scheduled_at);
      lines.push([
        d.toLocaleDateString(),
        fmtTime(a.scheduled_at),
        a.mother?.full_name ?? "",
        a.mother?.phone ?? "",
        a.type ?? "",
        a.status ?? "",
        (a.notes ?? "").replace(/[\r\n,]+/g, " "),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments-${ws.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function refresh() {
    if (!providerId) return;
    const { data } = await supabase
      .from("appointments")
      .select("id,scheduled_at,status,type,notes,mother_id,mother:mothers(id,full_name,pregnancy_week,phone)")
      .eq("provider_id", providerId)
      .order("scheduled_at", { ascending: true });
    setAppts((data as unknown as Appt[]) ?? []);
  }

  return (
    <EdenShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-medium text-gray-900">Appointments</h1>
          <p className="mt-1 font-sans text-sm text-gray-500">
            Manage your schedule for the week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export this week
          </Button>
          <div className="flex rounded-md border border-gray-200 bg-white p-0.5">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1 font-sans text-xs capitalize rounded",
                  view === v ? "bg-eve-teal text-white" : "text-gray-600",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 font-sans text-xs border",
              filter === f
                ? "bg-eve-teal-dark border-eve-teal-dark text-white"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {view === "week" ? (
        <WeekView
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          appts={filtered}
          onSlot={(d) => setNewSlot(d)}
          onSelect={(a) => setSelected(a)}
        />
      ) : (
        <MonthView
          cursor={monthCursor}
          setCursor={setMonthCursor}
          appts={filtered}
          onSelect={(a) => setSelected(a)}
          onDay={(d) => setNewSlot(d)}
        />
      )}

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <ApptDetail
              appt={selected}
              onClose={() => setSelected(null)}
              onChanged={async () => {
                await refresh();
                setSelected(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* New appointment modal */}
      <Dialog open={!!newSlot} onOpenChange={(o) => !o && setNewSlot(null)}>
        <DialogContent className="max-w-md">
          {newSlot && providerId && (
            <NewAppointment
              providerId={providerId}
              initial={newSlot}
              onClose={() => setNewSlot(null)}
              onCreated={async () => {
                await refresh();
                setNewSlot(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </EdenShell>
  );
}

function WeekView({
  weekStart,
  setWeekStart,
  appts,
  onSlot,
  onSelect,
}: {
  weekStart: Date;
  setWeekStart: (d: Date) => void;
  appts: Appt[];
  onSlot: (d: Date) => void;
  onSelect: (a: Appt) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="font-sans text-sm font-medium text-gray-900">
          {weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })} —{" "}
          {addDays(weekStart, 6).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[840px] grid-cols-[64px_repeat(7,1fr)]">
          <div className="border-b border-r border-gray-100 bg-gray-50" />
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className="border-b border-r border-gray-100 bg-gray-50 px-2 py-2 text-center"
            >
              <div className="font-sans text-[11px] uppercase tracking-wide text-gray-500">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className="font-sans text-sm font-medium text-gray-900">
                {d.getDate()}
              </div>
            </div>
          ))}

          {HOURS.map((h) => (
            <Fragment key={`row-${h}`}>
              <div
                className="h-16 border-b border-r border-gray-100 px-2 py-1 text-right font-sans text-[11px] text-gray-500"
              >
                {h}:00
              </div>
              {days.map((d) => {
                const slot = new Date(d);
                slot.setHours(h, 0, 0, 0);
                const slotEnd = new Date(slot);
                slotEnd.setHours(h + 1);
                const here = appts.filter((a) => {
                  const t = new Date(a.scheduled_at);
                  return t >= slot && t < slotEnd;
                });
                return (
                  <div
                    key={`${d.toISOString()}-${h}`}
                    onClick={() => here.length === 0 && onSlot(slot)}
                    className="relative h-16 cursor-pointer border-b border-r border-gray-100 hover:bg-eve-teal-light/30"
                  >
                    {here.map((a) => (
                      <button
                        key={a.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(a);
                        }}
                        className={cn(
                          "absolute inset-x-1 top-1 rounded-md border px-2 py-1 text-left font-sans text-[11px] leading-tight",
                          STATUS_COLORS[a.status ?? "pending"],
                        )}
                      >
                        <div className="font-medium truncate">{a.mother?.full_name ?? "Patient"}</div>
                        <div className="opacity-80 truncate">{a.type ?? "Visit"}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthView({
  cursor,
  setCursor,
  appts,
  onSelect,
  onDay,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  appts: Appt[];
  onSelect: (a: Appt) => void;
  onDay: (d: Date) => void;
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="font-sans text-sm font-medium text-gray-900">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="border-b border-r border-gray-100 bg-gray-50 px-2 py-2 text-center font-sans text-[11px] uppercase text-gray-500">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const dayAppts = appts.filter((a) => {
            const t = new Date(a.scheduled_at);
            return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth() && t.getDate() === d.getDate();
          });
          return (
            <div
              key={d.toISOString()}
              onClick={() => {
                const s = new Date(d);
                s.setHours(9, 0, 0, 0);
                onDay(s);
              }}
              className={cn(
                "min-h-[88px] cursor-pointer border-b border-r border-gray-100 p-1.5 hover:bg-eve-teal-light/30",
                !inMonth && "bg-gray-50/50 text-gray-400",
              )}
            >
              <div className="font-sans text-xs text-gray-500">{d.getDate()}</div>
              <div className="mt-1 space-y-1">
                {dayAppts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(a);
                    }}
                    className={cn(
                      "block w-full truncate rounded px-1.5 py-0.5 text-left font-sans text-[10px] border",
                      STATUS_COLORS[a.status ?? "pending"],
                    )}
                  >
                    {fmtTime(a.scheduled_at)} {a.mother?.full_name ?? "Patient"}
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <div className="font-sans text-[10px] text-gray-500">+{dayAppts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApptDetail({
  appt,
  onClose,
  onChanged,
}: {
  appt: Appt;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState(appt.status ?? "pending");
  const [notes, setNotes] = useState(appt.notes ?? "");
  const [savedAt, setSavedAt] = useState<string>("");
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(appt.scheduled_at.slice(0, 16));
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (notes === (appt.notes ?? "")) return;
      await supabase.from("appointments").update({ notes }).eq("id", appt.id);
      setSavedAt(new Date().toLocaleTimeString());
    }, 700);
    return () => clearTimeout(t);
  }, [notes, appt.id, appt.notes]);

  async function changeStatus(s: string) {
    setStatus(s);
    await supabase.from("appointments").update({ status: s }).eq("id", appt.id);
  }

  function whatsappReminder() {
    const phone = appt.mother?.phone?.replace(/[^\d]/g, "");
    if (!phone) return;
    const msg = encodeURIComponent(
      `Reminder: appointment on ${new Date(appt.scheduled_at).toLocaleString()} for ${appt.type ?? "visit"}.`,
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    supabase.from("appointments").update({ reminder_sent: true }).eq("id", appt.id);
  }

  async function doReschedule() {
    await supabase.from("appointments").update({ scheduled_at: new Date(newDate).toISOString() }).eq("id", appt.id);
    onChanged();
  }

  async function doCancel() {
    if (!cancelReason.trim()) return;
    await supabase
      .from("appointments")
      .update({ status: "cancelled", notes: `[Cancelled: ${cancelReason}]\n${notes}` })
      .eq("id", appt.id);
    onChanged();
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-sans">{appt.mother?.full_name ?? "Patient"}</SheetTitle>
        <p className="font-sans text-xs text-gray-500">
          Week {appt.mother?.pregnancy_week ?? "—"} · {appt.type ?? "Visit"}
        </p>
      </SheetHeader>

      <div className="mt-5 space-y-5">
        <div>
          <p className="font-sans text-xs uppercase text-gray-500">When</p>
          <p className="font-sans text-sm text-gray-900">
            {new Date(appt.scheduled_at).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="font-sans text-xs uppercase text-gray-500">Status</p>
          <select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <p className="font-sans text-xs uppercase text-gray-500">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
          />
          {savedAt && <p className="mt-1 font-sans text-[10px] text-gray-400">Saved at {savedAt}</p>}
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={whatsappReminder}>
            Send WhatsApp reminder
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setRescheduling((v) => !v)}>
            Reschedule
          </Button>
          {rescheduling && (
            <div className="rounded-md border border-gray-200 p-3">
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
              />
              <Button className="mt-2 w-full bg-eve-teal hover:bg-eve-teal-dark" onClick={doReschedule}>
                Confirm new time
              </Button>
            </div>
          )}
          <Button variant="outline" className="w-full text-red-600" onClick={() => setCancelling((v) => !v)}>
            Cancel appointment
          </Button>
          {cancelling && (
            <div className="rounded-md border border-red-200 p-3">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (required)"
                rows={2}
                className="w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
              />
              <Button
                className="mt-2 w-full"
                variant="destructive"
                disabled={!cancelReason.trim()}
                onClick={doCancel}
              >
                Confirm cancellation
              </Button>
            </div>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

function NewAppointment({
  providerId,
  initial,
  onClose,
  onCreated,
}: {
  providerId: string;
  initial: Date;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Mother[]>([]);
  const [picked, setPicked] = useState<Mother | null>(null);
  const [type, setType] = useState("Consultation");
  const [when, setWhen] = useState(() => {
    const z = new Date(initial.getTime() - initial.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      // search via existing appointment patients (RLS-permitted via mothers join)
      const { data } = await supabase
        .from("appointments")
        .select("mother:mothers(id,full_name,phone,pregnancy_week)")
        .eq("provider_id", providerId)
        .limit(50);
      const seen = new Set<string>();
      const list: Mother[] = [];
      for (const r of (data as unknown as { mother: Mother | null }[]) ?? []) {
        if (!r.mother || seen.has(r.mother.id)) continue;
        const hay = `${r.mother.full_name ?? ""} ${r.mother.phone ?? ""}`.toLowerCase();
        if (hay.includes(q.toLowerCase())) {
          seen.add(r.mother.id);
          list.push(r.mother);
        }
      }
      setResults(list.slice(0, 8));
    }, 250);
    return () => clearTimeout(t);
  }, [q, providerId]);

  async function create() {
    if (!picked) return;
    setSaving(true);
    await supabase.from("appointments").insert({
      provider_id: providerId,
      mother_id: picked.id,
      scheduled_at: new Date(when).toISOString(),
      type,
      status: "confirmed",
      notes,
      reminder_sent: false,
    });
    setSaving(false);
    onCreated();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-sans">New appointment</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="font-sans text-xs uppercase text-gray-500">Patient</label>
          {picked ? (
            <div className="mt-1 flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
              <div className="font-sans text-sm">{picked.full_name}</div>
              <button onClick={() => setPicked(null)} className="font-sans text-xs text-eve-teal">
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or phone"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
              />
              {results.length > 0 && (
                <ul className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white">
                  {results.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => setPicked(m)}
                        className="block w-full px-3 py-2 text-left font-sans text-sm hover:bg-gray-50"
                      >
                        {m.full_name} <span className="text-xs text-gray-500">{m.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div>
          <label className="font-sans text-xs uppercase text-gray-500">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
          >
            <option>Consultation</option>
            <option>Scan</option>
            <option>Follow-up</option>
            <option>Home visit</option>
          </select>
        </div>

        <div>
          <label className="font-sans text-xs uppercase text-gray-500">Date & time</label>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
          />
        </div>

        <div>
          <label className="font-sans text-xs uppercase text-gray-500">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="bg-eve-teal hover:bg-eve-teal-dark"
          disabled={!picked || saving}
          onClick={create}
        >
          Confirm and notify patient
        </Button>
      </DialogFooter>
    </>
  );
}
