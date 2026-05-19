import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eden/patients/$id")({
  component: EdenPatientProfile,
});

type Mother = {
  id: string;
  full_name: string | null;
  city: string | null;
  country: string | null;
  pregnancy_week: number | null;
  due_date: string | null;
  language: string | null;
  phone: string | null;
  is_first_pregnancy: boolean | null;
  religious_pref: string | null;
  dietary_notes: string | null;
};

type Appt = {
  id: string;
  scheduled_at: string;
  status: string | null;
  type: string | null;
  notes: string | null;
};

type Note = {
  id: string;
  content: string;
  created_at: string;
  provider_id: string;
};

type Tab = "overview" | "appointments" | "notes" | "preferences";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "appointments", label: "Appointments" },
  { id: "notes", label: "Notes" },
  { id: "preferences", label: "Preferences" },
];

function initials(n?: string | null) {
  if (!n) return "·";
  return n.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function risk(week: number | null) {
  if (week == null) return "low" as const;
  if (week >= 37 || week < 12) return "medium" as const;
  return "low" as const;
}

function EdenPatientProfile() {
  const { id } = Route.useParams();
  const [mother, setMother] = useState<Mother | null>(null);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const draftId = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: prov } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!prov) {
        setLoading(false);
        return;
      }
      setProviderId(prov.id);

      const [{ data: m }, { data: a }, { data: n }] = await Promise.all([
        supabase
          .from("mothers")
          .select(
            "id,full_name,city,country,pregnancy_week,due_date,language,phone,is_first_pregnancy,religious_pref,dietary_notes",
          )
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("appointments")
          .select("id,scheduled_at,status,type,notes")
          .eq("provider_id", prov.id)
          .eq("mother_id", id)
          .order("scheduled_at", { ascending: false }),
        supabase
          .from("patient_notes")
          .select("id,content,created_at,provider_id")
          .eq("mother_id", id)
          .order("created_at", { ascending: false }),
      ]);

      setMother((m as Mother) ?? null);
      setAppts((a as Appt[]) ?? []);
      setNotes((n as Note[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  function scheduleAutosave(text: string) {
    setDraft(text);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      if (!providerId || !text.trim()) return;
      if (draftId.current) {
        const { error } = await supabase
          .from("patient_notes")
          .update({ content: text, updated_at: new Date().toISOString() })
          .eq("id", draftId.current);
        if (!error) {
          setSavedAt(new Date().toISOString());
          setNotes((xs) =>
            xs.map((x) => (x.id === draftId.current ? { ...x, content: text } : x)),
          );
        }
      } else {
        const { data, error } = await supabase
          .from("patient_notes")
          .insert({ mother_id: id, provider_id: providerId, content: text })
          .select("id,content,created_at,provider_id")
          .single();
        if (!error && data) {
          draftId.current = data.id;
          setSavedAt(data.created_at);
          setNotes((xs) => [data as Note, ...xs]);
        }
      }
    }, 800);
  }

  function newNote() {
    draftId.current = null;
    setDraft("");
    setSavedAt(null);
  }

  if (loading) {
    return (
      <EdenShell>
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
      </EdenShell>
    );
  }

  if (!mother) {
    return (
      <EdenShell>
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="font-sans text-sm text-gray-600">Patient not found.</p>
          <Link to="/eden/patients" className="mt-2 inline-block text-xs text-eve-teal hover:underline">
            Back to patients
          </Link>
        </div>
      </EdenShell>
    );
  }

  const r = risk(mother.pregnancy_week);
  const waLink = mother.phone
    ? `https://wa.me/${mother.phone.replace(/[^\d]/g, "")}`
    : null;

  return (
    <EdenShell>
      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div
            className="flex items-center justify-center rounded-full bg-eve-teal/10 font-sans text-lg font-semibold text-eve-teal-dark"
            style={{ width: 56, height: 56 }}
          >
            {initials(mother.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-sans text-[20px] font-medium text-gray-900">
              {mother.full_name ?? "Patient"}
            </h1>
            <p className="mt-1 font-sans text-sm text-gray-500">
              {[
                mother.city,
                mother.pregnancy_week != null ? `Week ${mother.pregnancy_week}` : null,
                mother.due_date ? `Due ${fmtDate(mother.due_date)}` : null,
                mother.language ? mother.language.toUpperCase() : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge risk={r} />
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 font-sans text-xs font-medium text-white hover:opacity-90"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp patient
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-4 py-2.5 font-sans text-sm transition-colors",
              tab === t.id
                ? "border-eve-teal text-eve-teal-dark"
                : "border-transparent text-gray-500 hover:text-gray-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="Pregnancy">
              <Field label="Current week" value={mother.pregnancy_week ?? "—"} />
              <Field label="Due date" value={fmtDate(mother.due_date)} />
              <Field
                label="Pregnancy"
                value={mother.is_first_pregnancy == null ? "—" : mother.is_first_pregnancy ? "First" : "Subsequent"}
              />
              <Field label="Risk" value={r} />
            </Card>
            <Card title="Contact & culture">
              <Field label="Phone" value={mother.phone ?? "—"} />
              <Field label="City" value={mother.city ?? "—"} />
              <Field label="Country" value={mother.country ?? "—"} />
              <Field label="Language" value={mother.language ?? "—"} />
              <Field label="Religious preference" value={mother.religious_pref ?? "—"} />
              <Field label="Dietary notes" value={mother.dietary_notes ?? "—"} />
            </Card>
          </div>
        )}

        {tab === "appointments" && (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-sans text-base font-medium text-gray-900">
                Appointment history
              </h2>
              <Link
                to="/eden/appointments"
                className="rounded-full bg-eve-teal px-3 py-1.5 font-sans text-xs font-medium text-white hover:bg-eve-teal-dark"
              >
                + New appointment
              </Link>
            </div>
            {appts.length === 0 ? (
              <p className="px-5 py-8 text-center font-sans text-sm text-gray-500">
                No appointments yet.
              </p>
            ) : (
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appts.map((a) => (
                    <tr key={a.id}>
                      <td className="px-5 py-3 text-gray-900">
                        {new Date(a.scheduled_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{a.type ?? "Visit"}</td>
                      <td className="px-5 py-3 text-gray-600 capitalize">{a.status ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 truncate max-w-[280px]">
                        {a.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="space-y-4">
            <Card title="Add note">
              <textarea
                value={draft}
                onChange={(e) => scheduleAutosave(e.target.value)}
                rows={5}
                placeholder="Clinical observations, follow-up plan, lab results…"
                className="w-full rounded-lg border border-gray-200 bg-white p-3 font-sans text-sm focus:border-eve-teal focus:outline-none focus:ring-1 focus:ring-eve-teal"
              />
              <div className="mt-2 flex items-center justify-between font-sans text-xs text-gray-500">
                <span>
                  {savedAt
                    ? `Auto-saved ${new Date(savedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
                    : "Notes auto-save as you type."}
                </span>
                {savedAt && (
                  <button onClick={newNote} className="text-eve-teal hover:underline">
                    + Start a new note
                  </button>
                )}
              </div>
            </Card>

            {notes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center font-sans text-sm text-gray-500">
                No notes yet. Provider-only — not visible to the patient.
              </p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between font-sans text-xs text-gray-500">
                      <span>
                        {new Date(n.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>You</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap font-sans text-sm text-gray-800">
                      {n.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "preferences" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-eve-teal/30 bg-eve-teal/5 p-3 font-sans text-xs text-eve-teal-dark">
              These are the mother's stated preferences to guide culturally
              appropriate care conversations.
            </div>
            <Card title="Stated preferences">
              <Field label="Language" value={mother.language ?? "—"} />
              <Field label="Dietary notes" value={mother.dietary_notes ?? "—"} />
              <Field label="Religious preference" value={mother.religious_pref ?? "—"} />
            </Card>
          </div>
        )}
      </div>
    </EdenShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="font-sans text-sm font-medium text-gray-900">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-1.5 last:border-0">
      <span className="font-sans text-xs text-gray-500">{label}</span>
      <span className="font-sans text-sm font-medium capitalize text-gray-900">{value}</span>
    </div>
  );
}

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const map = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-700",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium capitalize",
        map[risk],
      )}
    >
      {risk} risk
    </span>
  );
}
